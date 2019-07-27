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
const getD3Event = () => d3select.event

interface SimulationHierarchyNode
  extends d3force.SimulationNodeDatum,
    HierarchyNode<NodeData> {
  hiddenChildren?: SimulationHierarchyNode[]
}

@Component
export default class VGraph extends Vue {
  @Ref() readonly svg!: SVGElement
  @Ref() readonly linksGroup!: SVGGElement
  @Ref() readonly nodesGroup!: SVGGElement
  @Ref() readonly labelsGroup!: SVGGElement

  // nodes: SimulationHierarchyNode[] = []
  // links: HierarchyLink<NodeData>[] = []
  tree: SimulationHierarchyNode = d3tree.hierarchy(nodeDataFactory('root'))

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

  // Config
  repellantStrength = -10
  linkDistance = 5
  linkPullingForce = 2

  created() {
    this.simulation = d3force
      .forceSimulation<SimulationHierarchyNode, HierarchyLink<NodeData>>()
      .force('charge', d3force.forceManyBody().strength(this.repellantStrength))
      .force(
        'collide',
        d3force
          .forceCollide<SimulationHierarchyNode>()
          .radius(node => node.data.radius),
      )
      .force(
        'link',
        d3force
          .forceLink<SimulationHierarchyNode, HierarchyLink<NodeData>>()
          .distance(link => link.source.data.radius * this.linkDistance)
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

  get stateTree() {
    return vxm.graph.tree
  }

  @Watch('stateTree')
  buildTree(newData: NodeData) {
    const tree: SimulationHierarchyNode = d3tree.hierarchy(newData)
    tree.each(n => {
      n.x = this.center.x
      n.y = this.center.y
    })
    if (tree.children) {
      tree.children.forEach(c => c.eachAfter(this.toggleCollapse))
    }

    this.tree = tree
  }

  private isPrimitive(test: any) {
    return test !== Object(test)
  }

  get nodes() {
    return this.tree.descendants().filter(n => n.data.name != 'root')
  }

  get links() {
    return this.tree.links().filter(link => link.source.data.name != 'root')
  }

  @Watch('tree', { deep: true })
  updateSimulationNodes() {
    if (this.simulation) {
      if (!this.simulation.nodes().length) {
        this.simulation.alpha(1).restart()
      }

      this.simulation.nodes(this.nodes)
    }
  }

  @Watch('links')
  updateSimulationLinks() {
    if (this.simulation) {
      this.simulation
        .force<
          d3force.ForceLink<SimulationHierarchyNode, HierarchyLink<NodeData>>
        >('link')!
        .links(this.links)
    }
  }

  drawGarph() {
    this.drawNodes()
    this.drawLabels()
    this.drawLinks()
  }

  drawLinks() {
    function updatePos(e: any) {
      return
    }
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
            .attr('cx', node => node.x || this.center.x)
            .attr('cy', node => node.y || this.center.y)
            .call(
              d3drag
                .drag<SVGCircleElement, SimulationHierarchyNode>()
                .on('start', this.dragstarted)
                .on('drag', this.dragged)
                .on('end', this.dragended),
            )
            .on('click', this.nodeClicked)

          e.transition().attr('r', node => node.data.radius)

          return e
        },
        update =>
          update
            .attr('cx', node => node.x || this.center.x)
            .attr('cy', node => node.y || this.center.y)
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
    const updateLabel = (e: any) => {
      return e
        .attr(
          'x',
          (node: SimulationHierarchyNode) =>
            (node.x || this.center.x) + node.data.radius + 10,
        )
        .attr('y', (node: SimulationHierarchyNode) => node.y)
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

  // // Make store value watchable
  // get selectedNode() {
  //   return vxm.graph.selectedNode
  // }

  // Make store value watchable
  get openFolder() {
    return vxm.graph.openFolder
  }

  // @Watch('selectedNode')
  // @Watch('openFolder')
  // buildBreadCrumb(newSelection: NodeData) {
  //   if (!newSelection) {
  //     return
  //   }
  //   const prefix = []
  //   const suffix = [{ text: newSelection.name }]
  //   if (this.openFolder) {
  //     prefix.push({ text: this.openFolder })
  //   }
  //   if (!newSelection) {
  //     this.breadCrumbItems = prefix
  //     return
  //   }

  //   this.breadCrumbItems = prefix.concat(
  //     this.getParentTree(newSelection)
  //       .map(n => {
  //         return { text: n.name }
  //       })
  //       .reverse()
  //       .concat(suffix),
  //   )
  // }

  async nodeClicked(node: SimulationHierarchyNode) {
    this.$emit('node-click', getD3Event(), node)

    if (node.children) {
      if (vxm.graph.selectedNode === node.data) {
        this.toggleCollapse(node)
      } else {
        vxm.graph.selectNode(node.data)
      }
    } else {
      vxm.graph.selectNode(node.data)
      this.toggleCollapse(node)
    }
  }

  private toggleCollapse(node: SimulationHierarchyNode) {
    if (node.children) {
      node.hiddenChildren = node.children
      node.children = undefined
    } else {
      node.children = node.hiddenChildren
      node.hiddenChildren = undefined
    }
  }

  // isSelected(node: NodeData) {
  //   return vxm.graph.selectedNode === node
  // }
  nodeClass(node: SimulationHierarchyNode): string {
    const selectedNode = vxm.graph.selectedNode
    const cssClass = ['node']
    if (selectedNode === node.data) {
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
