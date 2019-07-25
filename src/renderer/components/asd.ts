import { Component, Prop, Vue } from 'vue-property-decorator'
import { remote, ipcRenderer, ipcMain } from 'electron'
// @ts-ignore
import VGraph, { INode, ILink } from './VGraph'
// @ts-ignore
import hcl from 'gopher-hcl'
import { promises as fsPromises } from 'fs'
import * as path from 'path'
import merge from 'lodash.merge'
import uuidv4 from 'uuid/v4'

class Node implements INode {
    constructor(
        public name: string,
        public parentId: string | null,
        public visible: boolean = false,
        public radius: number = 20,
        public id: string = uuidv4(),
        public selected: boolean = false,
    ) { }
}

class Link implements ILink {
    constructor(public sourceId: string, public targetId: string) { }
}

interface Hcl {
    [s: string]: any
}

@Component({
    components: { VGraph },
})
export default class TerraGraph extends Vue {
    parsedHcl: Hcl = {}

    async mounted() {
        await this.import('/home/zrean/Documents/TerraCAD/infra')
        ipcRenderer.on('folder-opened', async (event: any, folderName: string) => {
            await this.import(folderName)
        })
    }

    get nodes(): Node[] {
        return this.generateNodes(this.parsedHcl)
    }

    get links(): Link[] {
        return this.nodes
            .filter((n) => n.parentId != null)
            .map((n) => new Link(n.parentId!, n.id))
    }

    private isPrimitive(obj: any) {
        return obj !== Object(obj)
    }

    private generateNodes(
        hclObj: Hcl,
        parentId: string | null = null,
        nodes: Node[] = [],
        depth = 3,
    ): Node[] {
        if (depth === 0) {
            return nodes
        } else {
            depth--
        }
        const nodeSize = (d: number = depth) => depth * 10 + 20
        for (const key of Object.keys(hclObj)) {
            const id = uuidv4()
            const value: any = hclObj[key]
            const node = new Node(key, parentId, depth >= 2, nodeSize(), id)
            nodes.push(node)

            if (this.isPrimitive(value)) {
                const primitiveNode = new Node(value, id, false, nodeSize(depth - 1))
                nodes.push(primitiveNode)
            } else {
                nodes.concat(this.generateNodes(value, id, nodes, depth))
            }
        }
        return nodes
    }

    private async import(dirPath: string) {
        const filenames = await fsPromises.readdir(dirPath)
        const fileDatas = await Promise.all(
            filenames
                .filter((f) => f.split('.').pop() === 'tf')
                .map(async (f) => {
                    const filepath = path.join(dirPath, f)
                    return hcl.parse(await fsPromises.readFile(filepath, 'utf-8'))
                }),
        )

        this.parsedHcl = fileDatas.reduce(merge, {})
    }

    private getChildren(node: Node): Node[] {
        return this.nodes.filter((n: any) => n.parentId === node.id)
    }
}
