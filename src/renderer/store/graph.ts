import { VuexModule, mutation, action, getter, Module } from "vuex-class-component";
import * as d3select from "d3-selection";
import * as d3drag from "d3-drag";
import * as d3zoom from "d3-zoom";
import * as d3force from "d3-force";
import * as d3transition from "d3-transition";


export interface INode {
    id: string;
    name: string;
    radius: number;
    visible: boolean;
    x?: number;
    y?: number;
}

export interface ILink {
    source_id: string;
    target_id: string;
}

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
    ) { }
}

class Link implements d3force.SimulationLinkDatum<Node> {
    constructor(
        public source: Node,
        public target: Node,
        public index?: number
    ) { }
}

@Module({ namespacedPath: "graph/" })
export class GraphStore extends VuexModule {

    nodes: Node[] = [];
    links: Link[] = [];

    get visibleNodes() {
        return this.nodes.filter(n => n.visible);
    }

    @mutation newLinks(newLinks: ILink[]) {
        this.links = newLinks
            .filter(
                link =>
                    this.visibleNodes.some(n => n.id == link.source_id) &&
                    this.visibleNodes.some(n => n.id == link.target_id)
            )
            .map((link: ILink, index: number) => {
                const sourceNode = this.visibleNodes.find(n => n.id == link.source_id)!;
                const targetNode = this.visibleNodes.find(n => n.id == link.target_id)!;
                return new Link(sourceNode, targetNode);
            });
    }

    @mutation newNodes(newNodes: INode[]) {
        this.nodes = newNodes.map((netNode: INode, index: number) => {
            const nodeId = !netNode.id ? index.toString() : netNode.id;
            const nodeName =
                !netNode.name && netNode.name !== "0" ? `node ${nodeId}` : netNode.name;

            const newNode = new Node(
                nodeId,
                nodeName,
                netNode.x || 0,
                netNode.y || 0,
                netNode.radius,
                netNode.visible
            );

            // Check if node already exists and assign current pos
            const oldNode = this.nodes.find(n => n.id == nodeId);
            if (oldNode) {
                newNode.x = oldNode.x;
                newNode.y = oldNode.y;
                newNode.selected = oldNode.selected;
                newNode.fx = oldNode.fx;
                newNode.fy = oldNode.fy;
            }

            return newNode;
        });
    }

}

export const graph = GraphStore.ExtractVuexModule(GraphStore);