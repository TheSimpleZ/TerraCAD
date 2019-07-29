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
          const filePath = path.join(dirPath, f)
          return hcl.parse(await fsPromises.readFile(filePath, 'utf-8'))
        }),
    )
    this.parsedHcl = fileDatas.reduce(merge, {})
    this.openFolder = dirPath.split('/').pop()
    this.tree = d3tree.hierarchy(this.generateTree(this.parsedHcl))
  }

  private generateTree(hclData: Hcl) {
    const topLevelBlocksDepth: { [s: string]: number } = {
      resource: 2,
      data: 2,
      variable: 1,
      output: 1,
      locals: 1,
      module: 1,
      provider: 1,
      terraform: 1,
    }
    const convertHclToTree = (hclObj: Hcl, depth?: number): NodeData[] => {
      const nodes: NodeData[] = []
      for (const key of Object.keys(hclObj)) {
        let initialDepth = depth
        if (!initialDepth && initialDepth !== 0) {
          initialDepth = topLevelBlocksDepth[key]
        }
        const value: any = hclObj[key]
        const node = nodeDataFactory(key.split('_').join(' '))
        if (this.isPrimitive(value) || initialDepth === 0) {
          node.props = value
        } else {
          node.children = convertHclToTree(value, initialDepth - 1)
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
