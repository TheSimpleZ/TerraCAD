import { promises as fsPromises } from 'fs'
// @ts-ignore
import hcl from 'gopher-hcl'
import merge from 'lodash.merge'
import * as path from 'path'
import uuidv4 from 'uuid/v4'
import { Action, Module, Mutation, VuexModule } from 'vuex-class-modules'

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

class Node implements INode {
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
  get links(): Link[] {
    return this.nodes
      .filter(n => n.parentId)
      .map(n => new Link(n.parentId!, n.id))
  }

  get selectedNode() {
    return this.nodes.find(n => n.selected)
  }

  get visibleNodes() {
    return this.nodes.filter(n => n.visible)
  }

  nodes: Node[] = []
  parsedHcl: Hcl = {}
  openFolder?: string = ''

  @Mutation
  setSelected({ node, selected }: { node: INode; selected: boolean }) {
    const targetNode = this.nodes.find(n => n.id === node.id)
    if (targetNode) {
      targetNode.selected = selected
    }
  }
  @Mutation
  setVisible({ node, visible }: { node: INode; visible: boolean }) {
    const targetNode = this.nodes.find(n => n.id === node.id)
    if (targetNode) {
      targetNode.visible = visible
    }
  }

  @Mutation
  setExpanded({ node, expanded }: { node: INode; expanded: boolean }) {
    const targetNode = this.nodes.find(n => n.id === node.id)
    if (targetNode) {
      targetNode.expanded = expanded
    }
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
  }

  @Action async selectNode(node: INode) {
    this.nodes.forEach(n => {
      this.setSelected({ node: n, selected: n.id === node.id })
    })
  }

  @Action async toggleVisible(node: INode) {
    this.setVisible({ node, visible: !node.visible })
  }

  @Action
  async toggleExpand(node: INode) {
    if (!node.expanded) {
      this.expandNode(node)
    } else if (this.isSelected(node)) {
      this.collapseNode(node)
    }
    this.setExpanded({ node, expanded: !node.expanded })
  }

  private expandNode(node: INode) {
    this.getNodeChildren(node).forEach(n =>
      this.setVisible({ node: n, visible: true }),
    )
  }

  private collapseNode(node: INode) {
    const collapseRecurse = (rNode: INode) => {
      this.getNodeChildren(rNode).forEach(n => collapseRecurse(n))
      this.setVisible({ node: rNode, visible: false })
    }

    this.getNodeChildren(node).forEach(n => collapseRecurse(n))
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
          key,
          id,
          parentId,
          depth * 10 + 20,
          depth >= initialDepth - 1,
        )
        if (depth === 1) {
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
