<template lang="pug">
v-layout(
  fill-height
  column
)
  v-flex(
      shrink
    )
    v-breadcrumbs(
          :items="breadCrumbItems" 
          divider=">"
        )
  v-flex
    svg.svg(
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink= "http://www.w3.org/1999/xlink"
          ref="svg"
          pointer-events="all"
          )
      g(:transform="transform")
        g.links#l-links(ref="linksGroup")
        g.nodes#l-nodes(ref="nodesGroup")
        g.labels#node-labels(ref="labelsGroup")
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from 'vue-property-decorator'
import * as d3select from 'd3-selection'
import * as d3drag from 'd3-drag'
import * as d3zoom from 'd3-zoom'
import * as d3force from 'd3-force'
import * as d3transition from 'd3-transition'
import { vxm } from '../store'
import { INode, ILink } from '../store/graph'
const getD3Event = () => d3select.event

export class Node implements INode, d3force.SimulationNodeDatum {
  constructor(
    public id: string,
    public name: string,
    public x: number = 0,
    public y: number = 0,
    public radius: number = 10,
    public visible: boolean = true,
    public expanded: boolean = false,
    public selected: boolean = false,
    public fx?: number,
    public fy?: number,
  ) {}
}

class Link implements d3force.SimulationLinkDatum<Node> {
  constructor(
    public source: Node,
    public target: Node,
    public index?: number | undefined,
  ) {}
}

@Component
export default class VGraph extends Vue {
  get inputLinks(): ILink[] {
    return vxm.graph.links
  }
  @Prop({ default: true }) readonly nodeLabels!: boolean

  @Ref() readonly svg!: SVGElement
  @Ref() readonly linksGroup!: SVGGElement
  @Ref() readonly nodesGroup!: SVGGElement
  @Ref() readonly labelsGroup!: SVGGElement

  nodes: Node[] = []
  links: Link[] = []

  simulation: d3force.Simulation<Node, Link> | null = null
  transform = d3zoom.zoomIdentity
  breadCrumbItems: Array<{
    text: string
    disabled?: boolean
    href?: string
  }> = []

  // Config
  repellantStrength = -10
  linkDistance = 5
  linkPullingForce = 2

  created() {
    this.simulation = d3force
      .forceSimulation<Node, Link>()
      .force('charge', d3force.forceManyBody().strength(this.repellantStrength))
      .force(
        'collide',
        d3force.forceCollide<Node>().radius(node => node.radius),
      )
      .force(
        'link',
        d3force
          .forceLink<Node, Link>()
          .id(node => {
            return node.id.toString()
          })
          .distance(link => link.source.radius * this.linkDistance)
          .strength(this.linkPullingForce),
      )
      .on('tick', () => this.drawGarph())
  }

  mounted() {
    const svgSelect = d3select
      .select(this.svg)
      .call(d3zoom
        .zoom<SVGElement, {}>()
        .on('zoom', () => (this.transform = getD3Event().transform)) as any)
      .on('dblclick.zoom', null)
  }

  get center() {
    return {
      x: this.$el.clientWidth / 2 + this.$el.clientWidth / 200,
      y: this.$el.clientHeight / 2 + this.$el.clientHeight / 200,
    }
  }

  get visibleNodes() {
    return vxm.graph.visibleNodes
  }

  @Watch('visibleNodes', { deep: true })
  buildNodes(newNodes: INode[]) {
    this.nodes = newNodes.map((netNode: INode, index: number) => {
      const nodeId = !netNode.id ? index.toString() : netNode.id
      const nodeName =
        !netNode.name && netNode.name !== '0' ? `node ${nodeId}` : netNode.name

      const newNode = new Node(
        nodeId,
        nodeName,
        this.center.x,
        this.center.y,
        netNode.radius,
        netNode.visible,
        netNode.expanded,
      )

      // Check if node already exists and assign current
      const oldNode = this.nodes.find(n => n.id === nodeId)
      if (oldNode) {
        newNode.x = oldNode.x
        newNode.y = oldNode.y
        newNode.fx = oldNode.fx
        newNode.fy = oldNode.fy
      }

      return newNode
    })
  }

  @Watch('inputLinks')
  @Watch('nodes')
  buildLinks() {
    this.links = this.inputLinks
      .filter(
        link =>
          this.nodes.some(n => n.id === link.sourceId) &&
          this.nodes.some(n => n.id === link.targetId),
      )
      .map((link: ILink, index: number) => {
        const sourceNode = this.nodes.find(n => n.id === link.sourceId)!
        const targetNode = this.nodes.find(n => n.id === link.targetId)!
        return new Link(sourceNode, targetNode)
      })
  }

  @Watch('nodes')
  @Watch('links')
  updateSimulation() {
    if (this.simulation) {
      if (!this.simulation.nodes().length) {
        this.simulation.alpha(1).restart()
      }

      this.simulation.nodes(this.nodes)
      if (this.links && this.links.length) {
        this.simulation
          .force<d3force.ForceLink<Node, Link>>('link')!
          .links(this.links)
      }
    }
  }

  drawGarph() {
    this.drawNodes()
    if (this.nodeLabels) {
      this.drawLabels()
    }
    this.drawLinks()
  }

  drawLinks() {
    function updatePos(e: any) {
      return
    }
    d3select
      .select(this.linksGroup)
      .selectAll('line')
      .data(this.links)
      .join(
        enter => enter.append('line').attr('stroke', 'white'),
        update =>
          update
            .attr('x1', (link: any) => link.source.x)
            .attr('y1', (link: any) => link.source.y)
            .attr('x2', (link: any) => link.target.x)
            .attr('y2', (link: any) => link.target.y),
        exit => exit.remove(),
      )
  }

  drawNodes() {
    d3select
      .select(this.nodesGroup)
      .selectAll('circle')
      .data(this.nodes, n => (n as Node).id)
      .join(
        enter => {
          const e = enter
            .append('circle')
            .attr('class', this.nodeClass)
            .attr('cx', node => node.x)
            .attr('cy', node => node.y)
            .call(
              d3drag
                .drag<SVGCircleElement, Node>()
                .on('start', this.dragstarted)
                .on('drag', this.dragged)
                .on('end', this.dragended),
            )
            .on('click', this.nodeClicked)

          e.transition().attr('r', node => node.radius)

          return e
        },
        update =>
          update
            .attr('cx', node => node.x)
            .attr('cy', node => node.y)
            .attr('class', this.nodeClass),
        exit =>
          exit
            .transition()
            .duration(25)
            .attr('r', 0)
            .remove(),
      )
  }

  drawLabels() {
    function updateLabel(e: any) {
      return e
        .attr('x', (node: any) => node.x + node.radius + 10)
        .attr('y', (node: any) => node.y)
        .text((node: any) => node.name)
    }
    d3select
      .select(this.labelsGroup)
      .selectAll('text')
      .data(this.nodes)
      .join(
        enter => updateLabel(enter.append('text').attr('class', 'node-label')),
        updateLabel,
        exit => exit.remove(),
      )
  }

  // Make store value watchable
  get selectedNode() {
    return vxm.graph.selectedNode
  }

  // Make store value watchable
  get openFolder() {
    return vxm.graph.openFolder
  }

  @Watch('selectedNode')
  @Watch('openFolder')
  buildBreadCrumb(newSelection: Node) {
    if (!newSelection) {
      return
    }
    const prefix = []
    const suffix = [{ text: newSelection.name }]
    if (this.openFolder) {
      prefix.push({ text: this.openFolder })
    }
    if (!newSelection) {
      this.breadCrumbItems = prefix
      return
    }

    this.breadCrumbItems = prefix.concat(
      this.getParentTree(newSelection)
        .map(n => {
          return { text: n.name }
        })
        .reverse()
        .concat(suffix),
    )
  }

  getParentTree(node: Node): Node[] {
    const parents = []
    let tempNode = node
    let parent: Node | undefined
    while ((parent = this.getParentNode(tempNode))) {
      parents.push(parent)
      tempNode = parent
    }
    return parents
  }

  getParentNode(node: Node): Node | undefined {
    return this.nodes.find(n =>
      this.inputLinks.some(l => l.sourceId === n.id && l.targetId === node.id),
    )
  }

  async nodeClicked(node: Node) {
    this.$emit('node-click', getD3Event(), node)

    if (!node.expanded) {
      await vxm.graph.toggleExpand(node)
      await vxm.graph.selectNode(node)
    } else if (this.isSelected(node)) {
      await vxm.graph.toggleExpand(node)
    } else {
      await vxm.graph.selectNode(node)
    }
  }

  isSelected(node: Node) {
    return vxm.graph.selectedNode && vxm.graph.selectedNode.id === node.id
  }

  nodeClass(node: Node): string {
    const cssClass = ['node']
    if (this.selectedNode && node.id === this.selectedNode.id) {
      cssClass.push('selected')
    }
    if (node.fx || node.fy) {
      cssClass.push('pinned')
    }
    return cssClass.join(' ')
  }

  dragstarted() {
    const event = getD3Event()
    if (!event.active) {
      this.simulation!.alphaTarget(0.3).restart()
    }
    const transform = this.transform
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  dragged() {
    const event = getD3Event()
    const transform = this.transform
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  dragended() {
    const event = getD3Event()
    if (!event.active) {
      this.simulation!.alphaTarget(0)
    }
    event.subject.fx = null
    event.subject.fy = null
  }
}
</script>
<style lang="stylus">
@import '../lib/styl/vars.styl';

.wrapper {
  height: 100%;
  width: 100%;
}

.svg {
  height: 100%;
  width: 100%;
  cursor: pointer;
}

.node {
  stroke: alpha($dark, 0.7);
  stroke-width: 3px;
  transition: fill 0.5s ease;
  fill: $white;
}

.node.selected {
  stroke: $color2;
}

.node.pinned {
  stroke: alpha($warn, 0.6);
}

.link {
  stroke: alpha($dark, 0.3);
}

.node, .link {
  stroke-linecap: round;

  &:hover {
    stroke: 'yellow';
    stroke-width: 5px;
  }
}

.link.selected {
  stroke: alpha($color2, 0.6);
}

.curve {
  fill: none;
}

.node-label {
  fill: #CCC;
  font-size: 20px;
}

.link-label {
  fill: $dark;
  transform: translate(0, -0.5em);
  text-anchor: middle;
}
</style>
