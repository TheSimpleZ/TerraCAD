import { promises as fsPromises } from 'fs'
// @ts-ignore
import hcl from 'gopher-hcl'
import merge from 'lodash.merge'
import * as path from 'path'
import { Action, Module, Mutation, VuexModule } from 'vuex-class-modules'
import * as d3tree from 'd3-hierarchy'

export interface Hcl {
  [s: string]: any
}

export interface NodeData {
  name: string
  children?: NodeData[]
  hiddenChildren?: NodeData[]
  props?: object
}

export function nodeDataFactory(name: string = 'root'): NodeData {
  return {
    name,
  }
}

@Module({ generateMutationSetters: true })
export class TerraGraphStore extends VuexModule {
  parsedHcl: Hcl = {}
  openFolder?: string = ''

  tree: d3tree.HierarchyNode<NodeData> = d3tree.hierarchy(nodeDataFactory())
  selectedNode: d3tree.HierarchyNode<NodeData> | null = null

  @Action
  async selectNode(node: d3tree.HierarchyNode<NodeData>) {
    this.selectedNode =
      this.tree.descendants().find(n => n.data === node.data) || null
  }

  @Action
  async importTerraformFolder(dirPath: string) {
    const filenames = await fsPromises.readdir(dirPath)
    const fileDatas = await Promise.all(
      filenames
        .filter(f => f.split('.').pop() === 'tf')
        .map(async f => {
          const filepath = path.join(dirPath, f)
          return hcl.parse(await fsPromises.readFile(filepath, 'utf-8'))
        }),
    )
    this.parsedHcl = fileDatas.reduce(merge, {})
    this.openFolder = dirPath.split('/').pop()
    this.tree = d3tree.hierarchy(this.generateTree(this.parsedHcl))
  }

  private generateTree(hclData: Hcl) {
    const convertHclToTree = (hclObj: Hcl, depth = 2): NodeData[] => {
      const nodes: NodeData[] = []
      for (const key of Object.keys(hclObj)) {
        const value: any = hclObj[key]
        const node = nodeDataFactory(key.split('_').join(' '))
        if (this.isPrimitive(value) || depth === 0) {
          node.props = value
        } else {
          node.children = convertHclToTree(value, depth - 1)
        }

        nodes.push(node)
      }
      return nodes
    }

    const rootNode = nodeDataFactory(this.openFolder)
    rootNode.children = convertHclToTree(hclData)
    return rootNode
  }

  private isPrimitive(test: any) {
    return test !== Object(test)
  }
}
