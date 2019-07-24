<template>
  <v-container fill-height fluid>
    <v-graph :input-nodes="nodes" :input-links="links" />
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { remote, ipcRenderer, ipcMain } from "electron";
import VGraph, { INode, ILink } from "./VGraph.vue";
// @ts-ignore
import hcl from "gopher-hcl";
import { promises as fsPromises } from "fs";
import * as path from "path";
import merge from "lodash.merge";
import uuidv4 from "uuid/v4";

class Node implements INode {
  constructor(
    public name: string,
    public parent_id: string | null,
    public visible: boolean = false,
    public radius: number = 20,
    public id: string = uuidv4(),
    public selected: boolean = false
  ) {}
}

class Link implements ILink {
  constructor(public source_id: string, public target_id: string) {}
}

interface Hcl {
  [s: string]: any;
}

@Component({
  components: { VGraph }
})
export default class TerraGraph extends Vue {
  parsedHcl: Hcl = {};

  async mounted() {
    await this.import("/home/zrean/Documents/TerraCAD/infra");
    ipcRenderer.on("folder-opened", async (event: any, folderName: string) => {
      await this.import(folderName);
    });
  }

  get nodes(): Node[] {
    return this.generateNodes(this.parsedHcl);
  }

  get links(): Link[] {
    return this.nodes
      .filter(n => n.parent_id != null)
      .map(n => new Link(n.parent_id!, n.id));
  }

  private isPrimitive(obj: any) {
    return obj !== Object(obj);
  }

  private generateNodes(
    hcl_obj: Hcl,
    parent_id: string | null = null,
    nodes: Node[] = [],
    depth = 3
  ): Node[] {
    if (depth == 0) {
      return nodes;
    } else {
      depth--;
    }
    const node_size = (d: number = depth) => depth * 10 + 20;
    for (let key in hcl_obj) {
      const id = uuidv4();
      const value: any = hcl_obj[key];
      const node = new Node(key, parent_id, depth >= 2, node_size(), id);
      nodes.push(node);

      if (this.isPrimitive(value)) {
        const node = new Node(value, id, false, node_size(depth - 1));
        nodes.push(node);
      } else {
        nodes.concat(this.generateNodes(value, id, nodes, depth));
      }
    }
    return nodes;
  }

  private async import(dirPath: string) {
    const filenames = await fsPromises.readdir(dirPath);
    let file_datas = await Promise.all(
      filenames
        .filter(f => f.split(".").pop() == "tf")
        .map(async f => {
          const filepath = path.join(dirPath, f);
          return hcl.parse(await fsPromises.readFile(filepath, "utf-8"));
        })
    );

    this.parsedHcl = file_datas.reduce(merge, {});
  }

  private getChildren(node: Node): Node[] {
    return this.nodes.filter((n: any) => n.parent_id == node.id);
  }
}
</script>

