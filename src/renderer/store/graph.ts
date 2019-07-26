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

export class Node {
  constructor(
    public name: string,
    public radius: number = 10,
    public selected: boolean = false,
    public children?: Node[],
    public hiddenChildren?: Node[],
    public props?: object,
  ) {}
}

@Module({ generateMutationSetters: true })
export class TerraGraphStore extends VuexModule {
  parsedHcl: Hcl = {}
  openFolder?: string = ''

  tree = new Node('root')

  // @Mutation
  // setSelected(node: INode) {
  //   this.forEachNode(n => (n.selected = node.id === n.id))
  // }

  // @Mutation
  // setProps({ node, props }: { node: INode; props?: object }) {
  //   this.setNodeProp(node, n => (n.props = props))
  // }

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

  // @Action async selectNode(node: INode) {
  //   this.setSelected(node)
  // }

  // @Action async updateProps(node: NodeData, props?: object) {
  //   this.setProps({ node, props })
  // }

  // @Action
  // async toggleExpand(node: INode) {
  //   if (!node.expanded) {
  //     this.expandNode(node)
  //   } else if (this.isSelected(node)) {
  //     this.collapseNode(node)
  //   }
  // }

  // @Mutation
  // expandNode(node: INode) {
  //   this.getNodeChildren(node).forEach(cn =>
  //     this.setNodeProp(cn, n => (n.visible = true)),
  //   )
  //   this.setNodeProp(node, n => (n.expanded = true))
  // }

  // @Mutation collapseNode(node: INode) {
  //   const collapseRecurse = (rNode: NodeData) => {
  //     if (rNode.visible) {
  //       this.getNodeChildren(rNode).forEach(n => collapseRecurse(n))
  //       this.setNodeProp(rNode, n => (n.visible = false))
  //     }
  //   }

  //   this.getNodeChildren(node).forEach(n => collapseRecurse(n))
  //   this.setNodeProp(node, n => (n.expanded = false))
  // }

  // private setNodeProp(node: INode, propFunc: (n: NodeData) => void) {
  //   const targetNode = this.nodes.find(n => n.id === node.id)
  //   if (targetNode) {
  //     propFunc(targetNode)
  //   }
  // }

  // private forEachNode(propFunc: (n: NodeData) => void) {
  //   this.nodes.forEach(propFunc)
  // }

  // private isSelected(node: INode) {
  //   return this.selectedNode && this.selectedNode.id === node.id
  // }

  // private getNodeChildren(node: INode) {
  //   return this.nodes.filter(n =>
  //     this.links.some(l => l.sourceId === node.id && l.targetId === n.id),
  //   )
  // }

  private generateTree(hclData: Hcl) {
    const convertHclToTree = (hclObj: Hcl, depth = 2): Node[] => {
      const nodes: Node[] = []
      for (const key of Object.keys(hclObj)) {
        const id = uuidv4()
        const value: any = hclObj[key]
        const node = new Node(key.split('_').join(' '), 30)
        if (this.isPrimitive(value) || depth === 0) {
          node.props = value
        } else {
          node.children = convertHclToTree(value, depth - 1)
        }

        nodes.push(node)
      }
      return nodes
    }

    const rootNode: Node = new Node('root')
    rootNode.children = convertHclToTree(hclData)
    return rootNode
  }

  private isPrimitive(test: any) {
    return test !== Object(test)
  }
}
