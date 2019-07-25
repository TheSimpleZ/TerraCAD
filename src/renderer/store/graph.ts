import { VuexModule, mutation, action, getter, Module } from 'vuex-class-component'

interface SelectedNode {
    id: string,
    name: string
}


@Module({ namespacedPath: 'graph/' })
export class GraphStore extends VuexModule {

    @getter selectedNode?: SelectedNode

    @mutation changeSelection(node: SelectedNode) {
        this.selectedNode = node
    }

    @action async newSelection(node: SelectedNode) {
        this.changeSelection(node)
    }

}

export const graph = GraphStore.ExtractVuexModule(GraphStore)
