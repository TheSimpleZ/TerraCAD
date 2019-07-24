<template lang="pug">
  svg(
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink= "http://www.w3.org/1999/xlink"
    ref="svg"
    class="net-svg"
    pointer-events="all"
    )
    g(:transform="transform")
      //-> links
      g.links#l-links(ref="linksGroup")
      //- -> nodes
      g.nodes#l-nodes(ref="nodesGroup")
      //- -> Node Labels
      g.labels#node-labels(ref="labelsGroup")
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from "vue-property-decorator";
import * as d3select from "d3-selection";
import * as d3drag from "d3-drag";
import * as d3zoom from "d3-zoom";
import * as d3force from "d3-force";
import * as d3transition from "d3-transition";
import { vxm } from "../store";
import { INode, ILink } from "../store/graph";
const getD3Event = () => d3select.event;

export interface Forces {
  X: boolean | number;
  Y: boolean | number;
  ManyBody: number;
  Link: boolean;
  Collide: boolean;
}

class Node implements INode, d3force.SimulationNodeDatum {
  constructor(
    public id: string,
    public name: string,
    public x: number = 0,
    public y: number = 0,
    public radius: number = 10,
    public visible: boolean = true,
    public selected: boolean = false,
    public fx?: number,
    public fy?: number
  ) {}
}

class Link implements d3force.SimulationLinkDatum<Node> {
  constructor(
    public source: Node,
    public target: Node,
    public index?: number
  ) {}
}

@Component
export default class VGraph extends Vue {
  @Prop() readonly inputNodes!: INode[];
  @Prop() readonly inputLinks!: ILink[];
  @Prop({ default: true }) readonly nodeLabels!: boolean;

  @Ref() readonly svg!: SVGElement;
  @Ref() readonly linksGroup!: SVGGElement;
  @Ref() readonly nodesGroup!: SVGGElement;
  @Ref() readonly labelsGroup!: SVGGElement;

  get nodes(): Node[] {
    return vxm.graph.nodes;
  }

  set nodes(val) {
    vxm.graph.newNodes(val);
  }

  get links(): Link[] {
    return vxm.graph.links;
  }

  simulation: d3force.Simulation<Node, Link> | null = null;
  transform = d3zoom.zoomIdentity;

  // Config
  repellantStrength = -120;
  linkDistance = 5;
  linkPullingForce = 2;

  created() {
    this.simulation = d3force
      .forceSimulation<Node, Link>()
      .force("charge", d3force.forceManyBody().strength(this.repellantStrength))
      .force(
        "collide",
        d3force.forceCollide<Node>().radius(node => node.radius)
      )
      .force(
        "link",
        d3force
          .forceLink<Node, Link>()
          .id(node => {
            return node.id.toString();
          })
          .distance(link => link.source.radius * this.linkDistance)
          .strength(this.linkPullingForce)
      );
  }

  mounted() {
    const svgSelect = d3select
      .select(this.svg)
      .call(
        d3zoom
          .zoom<SVGElement, {}>()
          .on("zoom", () => (this.transform = getD3Event().transform))
      )
      .on("dblclick.zoom", null);
  }

  get center() {
    return {
      x: this.$el.clientWidth / 2 + this.$el.clientWidth / 200,
      y: this.$el.clientHeight / 2 + this.$el.clientHeight / 200
    };
  }

  get visibleNodes() {
    return this.nodes.filter(n => n.visible);
  }

  @Watch("inputNodes", { deep: true })
  buildNodes(newNodes: INode[]) {
    vxm.graph.newNodes(
      newNodes.map(n => {
        n.x = this.center.x;
        n.y = this.center.y;
        return n;
      })
    );
  }

  @Watch("inputLinks")
  @Watch("visibleNodes")
  buildLinks() {
    vxm.graph.newLinks(this.inputLinks);
  }

  @Watch("visibleNodes", { deep: true })
  @Watch("links", { deep: true })
  drawGarph() {
    this.drawNodes();
    if (this.nodeLabels) this.drawLabels();
    this.drawLinks();

    if (this.simulation) {
      this.simulation.nodes(this.visibleNodes);
      if (this.links && this.links.length)
        this.simulation
          .force<d3force.ForceLink<Node, Link>>("link")!
          .links(this.links);
    }
  }

  drawLinks() {
    function updatePos(e: any) {
      return e
        .attr("x1", (link: any) => link.source.x)
        .attr("y1", (link: any) => link.source.y)
        .attr("x2", (link: any) => link.target.x)
        .attr("y2", (link: any) => link.target.y);
    }
    d3select
      .select(this.linksGroup)
      .selectAll("line")
      .data(this.links)
      .join(
        enter => {
          const e = enter.append("line").attr("stroke", "white");
          updatePos(e.transition());
          return e;
        },
        updatePos,
        exit =>
          exit
            .transition()
            .duration(25)
            .attr("x2", (link: any) => link.source.x)
            .attr("y2", (link: any) => link.source.y)
            .remove()
      );
  }

  drawNodes() {
    d3select
      .select(this.nodesGroup)
      .selectAll("circle")
      .data(this.visibleNodes, n => (n as Node).id)
      .join(
        enter => {
          let e = enter
            .append("circle")
            .attr("class", this.nodeClass)
            .call(
              d3drag
                .drag<SVGCircleElement, Node>()
                .on("start", this.dragstarted)
                .on("drag", this.dragged)
                .on("end", this.dragended)
            )
            .on("click", this.nodeClicked);

          e.transition()
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("r", node => node.radius);

          return e;
        },
        update =>
          update
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("class", this.nodeClass),
        exit =>
          exit
            .transition()
            .duration(25)
            .attr("r", 0)
            .remove()
      );
  }

  drawLabels() {
    function updateLabel(e: any) {
      return e
        .attr("x", (node: any) => node.x + node.radius + 10)
        .attr("y", (node: any) => node.y)
        .text((node: any) => node.name);
    }
    d3select
      .select(this.labelsGroup)
      .selectAll("text")
      .data(this.visibleNodes)
      .join(
        enter => updateLabel(enter.append("text").attr("class", "node-label")),
        updateLabel,
        exit => exit.remove()
      );
  }

  getNodeChildren(node: Node) {
    return this.nodes.filter(n =>
      this.inputLinks.some(l => l.source_id == node.id && l.target_id == n.id)
    );
  }

  expandNode(node: Node) {
    this.getNodeChildren(node).forEach(n => (n.visible = true));
  }

  collapseNode(node: Node) {
    this.getNodeChildren(node).forEach(this.collapseNode);
    node.visible = false;
  }

  nodeClicked(node: Node) {
    this.$emit("node-click", getD3Event(), node);

    if (!node.selected) {
      node.selected = true;
      this.expandNode(node);
    } else {
      this.getNodeChildren(node).forEach(this.collapseNode);
      node.selected = false;
    }
  }

  nodeClass(node: Node): string {
    let cssClass = ["node"];
    if (node.selected) cssClass.push("selected");
    if (node.fx || node.fy) cssClass.push("pinned");
    return cssClass.join(" ");
  }

  dragstarted() {
    const event = getD3Event();
    if (!event.active) this.simulation!.alphaTarget(0.3).restart();
    const transform = this.transform;
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  dragged() {
    const event = getD3Event();
    const transform = this.transform;
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  dragended() {
    const event = getD3Event();
    if (!event.active) this.simulation!.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}
</script>
<style lang="stylus">
@import '../lib/styl/vars.styl';

.net-svg {
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