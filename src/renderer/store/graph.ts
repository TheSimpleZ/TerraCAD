import { promises as fsPromises } from 'fs'
// @ts-ignore
import hcl from 'gopher-hcl'
import merge from 'lodash.merge'
import * as path from 'path'
import uuidv4 from 'uuid/v4'
import { Action, Module, Mutation, VuexModule } from 'vuex-class-modules'
import Vue from 'vue'

export interface INode {
  readonly id: string
  readonly name: string
  readonly radius: number
  readonly visible: boolean
  readonly selected: boolean
  readonly expanded: boolean
}

export interface ILink {
  readonly sourceId: string
  readonly targetId: string
}

export class Node implements INode {
  constructor(
    public name: string,
    public id: string = uuidv4(),
    public parentId?: string,
    public radius: number = 20,
    public visible: boolean = false,
    public selected: boolean = false,
    public expanded: boolean = false,
    public props?: object,
  ) {}
}

class Link implements ILink {
  constructor(public sourceId: string, public targetId: string) {}
}

interface Hcl {
  [s: string]: any
}

@Module({ generateMutationSetters: true })
export class TerraGraphStore extends VuexModule {
  get selectedNode() {
    return this.nodes.find(n => n.selected)
  }

  get visibleNodes() {
    return this.nodes.filter(n => n.visible)
  }

  links: Link[] = []
  nodes: Node[] = []
  parsedHcl: Hcl = {}
  openFolder?: string = ''

  @Mutation
  setSelected(node: INode) {
    this.forEachNode(n => (n.selected = node.id === n.id))
  }

  @Mutation
  setProps({ node, props }: { node: INode; props?: object }) {
    this.setNodeProp(node, n => (n.props = props))
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
    this.nodes = this.generateNodes(this.parsedHcl)
    this.openFolder = dirPath.split('/').pop()
    this.links = this.nodes
      .filter(n => n.parentId)
      .map(n => new Link(n.parentId!, n.id))
  }

  @Action async selectNode(node: INode) {
    this.setSelected(node)
  }

  @Action async updateProps(node: Node, props?: object) {
    this.setProps({ node, props })
  }

  @Action
  async toggleExpand(node: INode) {
    if (!node.expanded) {
      this.expandNode(node)
    } else if (this.isSelected(node)) {
      this.collapseNode(node)
    }
  }

  @Mutation
  expandNode(node: Node) {
    this.getNodeChildren(node).forEach(cn =>
      this.setNodeProp(cn, n => (n.visible = true)),
    )
    this.setNodeProp(node, n => (n.expanded = true))
  }

  @Mutation collapseNode(node: Node) {
    const collapseRecurse = (rNode: Node) => {
      if (rNode.visible) {
        this.getNodeChildren(rNode).forEach(n => collapseRecurse(n))
        this.setNodeProp(rNode, n => (n.visible = false))
      }
    }

    this.getNodeChildren(node).forEach(n => collapseRecurse(n))
    this.setNodeProp(node, n => (n.expanded = false))
  }

  private setNodeProp(node: INode, propFunc: (n: Node) => void) {
    const targetNode = this.nodes.find(n => n.id === node.id)
    if (targetNode) {
      propFunc(targetNode)
    }
  }

  private forEachNode(propFunc: (n: Node) => void) {
    this.nodes.forEach(propFunc)
  }

  private isSelected(node: INode) {
    return this.selectedNode && this.selectedNode.id === node.id
  }

  private getNodeChildren(node: INode) {
    return this.nodes.filter(n =>
      this.links.some(l => l.sourceId === node.id && l.targetId === n.id),
    )
  }

  private generateNodes(hclData: Hcl) {
    const initialDepth = 3
    const generateNodesRecurse = (
      hclObj: Hcl,
      parentId?: string,

      depth = initialDepth,
    ): Node[] => {
      let nodes: Node[] = []
      if (depth === 0) {
        return nodes
      } else {
        depth--
      }

      for (const key of Object.keys(hclObj)) {
        const id = uuidv4()
        const value: any = hclObj[key]
        const node = new Node(
          key.split('_').join(' '),
          id,
          parentId,
          depth * 10 + 20,
          depth >= initialDepth - 1,
        )
        if (depth === 0) {
          node.props = value
        }

        nodes.push(node)

        nodes = nodes.concat(generateNodesRecurse(value, id, depth))
      }
      return nodes
    }

    return generateNodesRecurse(hclData)
  }
}
