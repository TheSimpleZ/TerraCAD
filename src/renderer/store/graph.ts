import { promises as fsPromises } from 'fs'
// @ts-ignore
import hcl from 'gopher-hcl'
import merge from 'lodash.merge'
import * as path from 'path'
import uuidv4 from 'uuid/v4'
import { Action, Module, Mutation, VuexModule } from 'vuex-class-modules'

export interface Hcl {
  [s: string]: any
}

export interface NodeData {
  name: string
  radius: number
  selected: boolean
  children?: NodeData[]
  hiddenChildren?: NodeData[]
  props?: object
}

export function nodeDataFactory(
  name: string,
  radius = 20,
  selected = false,
): NodeData {
  return {
    name,
    radius,
    selected,
  }
}

@Module({ generateMutationSetters: true })
export class TerraGraphStore extends VuexModule {
  parsedHcl: Hcl = {}
  openFolder?: string = ''

  tree = nodeDataFactory('root')
  selectedNode: NodeData | null = null

  @Action
  async selectNode(node: NodeData) {
    this.selectedNode = node
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
    this.tree = this.generateTree(this.parsedHcl)
    this.openFolder = dirPath.split('/').pop()
  }

  private generateTree(hclData: Hcl) {
    const convertHclToTree = (hclObj: Hcl, depth = 2): NodeData[] => {
      const nodes: NodeData[] = []
      for (const key of Object.keys(hclObj)) {
        const id = uuidv4()
        const value: any = hclObj[key]
        const node = nodeDataFactory(key.split('_').join(' '), 30)
        if (this.isPrimitive(value) || depth === 0) {
          node.props = value
        } else {
          node.children = convertHclToTree(value, depth - 1)
        }

        nodes.push(node)
      }
      return nodes
    }

    const rootNode = nodeDataFactory('root')
    rootNode.children = convertHclToTree(hclData)
    return rootNode
  }

  private isPrimitive(test: any) {
    return test !== Object(test)
  }
}
