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
import * as d3tree from 'd3-hierarchy'
import uuidv4 from 'uuid/v4'

import { vxm } from '../store'
import { Hcl, NodeData, nodeDataFactory } from '../store/graph'
import { HierarchyLink, HierarchyNode } from 'd3-hierarchy'
import { watchFile } from 'fs'
const getD3Event = () => d3select.event

interface SimulationHierarchyNode
  extends d3force.SimulationNodeDatum,
    HierarchyNode<NodeData> {
  hiddenChildren?: SimulationHierarchyNode[]
}

@Component
export default class VGraph extends Vue {
  get stateTree() {
    return vxm.graph.tree
  }

  get nodes() {
    return this.tree.descendants()
  }

  get links() {
    return this.tree.links()
  }

  // Make store value watchable
  get openFolder() {
    return vxm.graph.openFolder
  }

  get selectedNode() {
    return vxm.graph.selectedNode
  }

  set selectedNode(value) {
    if (value) {
      vxm.graph.selectNode(value)
    }
  }

  @Ref() readonly svg!: SVGElement
  @Ref() readonly linksGroup!: SVGGElement
  @Ref() readonly nodesGroup!: SVGGElement
  @Ref() readonly labelsGroup!: SVGGElement

  simulation: d3force.Simulation<
    SimulationHierarchyNode,
    HierarchyLink<NodeData>
  > | null = null
  transform = d3zoom.zoomIdentity
  breadCrumbItems: Array<{
    text: string
    disabled?: boolean
    href?: string
  }> = []

  tree: SimulationHierarchyNode = d3tree.hierarchy(nodeDataFactory())

  // Config
  repellantStrength = -1000

  linkDistance = (l: HierarchyLink<NodeData>) => {
    const targetPerimiter = this.getNodePerimiter(l.target)
    const sourcePerimiter = this.getNodePerimiter(l.source)

    const padding =
      targetPerimiter && sourcePerimiter
        ? targetPerimiter * sourcePerimiter * 0.001
        : 0

    return targetPerimiter + sourcePerimiter + padding
  }
  nodeRadius = (depth: number) => 30 - 5 * depth

  mounted() {
    const zoom: any = d3zoom
      .zoom<SVGElement, {}>()
      .on('zoom', () => (this.transform = getD3Event().transform))

    const svgSelect = d3select
      .select(this.svg)
      .call(zoom)
      .on('dblclick.zoom', null)

    zoom.translateBy(
      svgSelect,
      this.$el.clientWidth / 2,
      this.$el.clientHeight / 2,
    )
  }

  @Watch('stateTree')
  buildTree(newTree: HierarchyNode<NodeData>) {
    const tree: SimulationHierarchyNode = newTree.copy()
    if (tree.children) {
      tree.children.forEach(this.toggleCollapse)
    }

    tree.fx = 0
    tree.fy = 0

    this.tree = tree
  }

  created() {
    this.simulation = d3force
      .forceSimulation<SimulationHierarchyNode, HierarchyLink<NodeData>>()
      .alphaDecay(0.005)
      .force('charge', d3force.forceManyBody())
      .force(
        'collide',
        d3force
          .forceCollide<SimulationHierarchyNode>()
          .radius(node => this.nodeRadius(node.depth)),
      )
      .force(
        'link',
        d3force.forceLink<SimulationHierarchyNode, HierarchyLink<NodeData>>(),
      )
      .on('tick', () => this.drawGarph())
    // .stop()
  }

  @Watch('tree', { deep: true })
  updateSimulation(
    newTree: SimulationHierarchyNode,
    oldTree: SimulationHierarchyNode,
  ) {
    if (this.simulation) {
      this.simulation
        .nodes(this.nodes)
        .force<
          d3force.ForceLink<SimulationHierarchyNode, HierarchyLink<NodeData>>
        >('link')!
        .links(this.links)
        .distance(this.linkDistance)
        .strength(1)

      this.simulation.alpha(1)
    }
  }

  drawGarph() {
    this.drawNodes()
    this.drawLabels()
    this.drawLinks()
  }

  drawLinks() {
    d3select
      .select(this.linksGroup)
      .selectAll<SVGLineElement, HierarchyLink<NodeData>>('line')
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
      .selectAll<SVGCircleElement, SimulationHierarchyNode>('circle')
      .data(this.nodes)
      .join(
        enter => {
          const e = enter
            .append('circle')
            .attr('class', this.nodeClass)
            .attr('cx', node => node.x || 0)
            .attr('cy', node => node.y || 0)
            .call(
              d3drag
                .drag<SVGCircleElement, SimulationHierarchyNode>()
                .on('start', this.dragstarted)
                .on('drag', this.dragged)
                .on('end', this.dragended),
            )
            .on('click', this.nodeClicked)

          e.attr('r', node => this.nodeRadius(node.depth))

          return e
        },
        update =>
          update
            .attr('cx', node => node.x!)
            .attr('cy', node => node.y!)
            .attr('class', this.nodeClass),
        exit =>
          exit
            // .transition()
            // .duration(25)
            // .attr('r', 0)
            .remove(),
      )
  }

  drawLabels() {
    const updateLabel = (e: any) => {
      return e
        .attr(
          'x',
          (node: SimulationHierarchyNode) =>
            (node.x || 0) + this.nodeRadius(node.depth) + 10,
        )
        .attr('y', (node: SimulationHierarchyNode) => node.y)
        .attr(
          'font-size',
          (node: SimulationHierarchyNode) =>
            this.nodeRadius(node.depth) / 20 + 'em',
        )
        .text((node: SimulationHierarchyNode) => node.data.name)
    }
    d3select
      .select(this.labelsGroup)
      .selectAll<SVGTextElement, SimulationHierarchyNode>('text')
      .data(this.nodes)
      .join(
        enter => updateLabel(enter.append('text').attr('class', 'node-label')),
        updateLabel,
        exit => exit.remove(),
      )
  }

  @Watch('selectedNode')
  @Watch('openFolder')
  buildBreadCrumb() {
    if (this.selectedNode) {
      this.breadCrumbItems = this.selectedNode
        .ancestors()
        .map(n => {
          return { text: n.data.name }
        })
        .reverse()
    }
  }

  async nodeClicked(node: SimulationHierarchyNode) {
    this.$emit('node-click', getD3Event(), node)

    if (node.children) {
      if (this.isSelected(node)) {
        this.toggleCollapse(this.selectedNode!)
      } else {
        this.selectedNode = node
      }
    } else {
      this.toggleCollapse(node)
      this.selectedNode = node
    }
  }

  private isSelected(node: SimulationHierarchyNode) {
    return this.selectedNode && this.selectedNode.data == node.data
  }

  private nodeClass(node: SimulationHierarchyNode): string {
    const cssClass = ['node']
    if (this.selectedNode && this.selectedNode.data === node.data) {
      cssClass.push('selected')
    }
    if (node.fx || node.fy) {
      cssClass.push('pinned')
    }
    return cssClass.join(' ')
  }

  private dragstarted() {
    const event = getD3Event()
    if (!event.active) {
      this.simulation!.alphaTarget(0.3).restart()
    }
    const transform = this.transform
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  private dragged() {
    const event = getD3Event()
    const transform = this.transform
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  private dragended() {
    const event = getD3Event()
    if (!event.subject.parent) {
      return
    }
    if (!event.active) {
      this.simulation!.alphaTarget(0)
    }
    event.subject.fx = null
    event.subject.fy = null
  }

  private getNodePerimiter(n: SimulationHierarchyNode) {
    let permiter = 0

    if (n.children) {
      const sourceRadius = this.nodeRadius(n.depth)
      const sourceChildrenRadius = this.nodeRadius(n.depth + 1)
      const minDistance = sourceChildrenRadius * 7

      const innerPerimiter =
        sourceChildrenRadius /
          Math.cos(Math.PI / 2 - Math.PI / (n.children.length + 1)) -
        sourceChildrenRadius

      const outerPerimiter =
        sourceRadius + innerPerimiter + sourceChildrenRadius * 2

      permiter = Math.max(outerPerimiter, minDistance)
    }
    return permiter
  }

  private toggleCollapse(node: SimulationHierarchyNode) {
    if (node.children) {
      node.eachAfter(n => {
        n.hiddenChildren = n.children
        n.children = undefined
      })
    } else if (node.hiddenChildren) {
      node.children = node.hiddenChildren
      node.hiddenChildren = undefined
    }
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
  // font-size: 20px;
}

.link-label {
  fill: $dark;
  transform: translate(0, -0.5em);
  text-anchor: middle;
}
</style>
