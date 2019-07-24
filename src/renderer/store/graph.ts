import { VuexModule, mutation, action, getter, Module } from 'vuex-class-component';

interface SelectedNode {
    id: string,
    name: string
}


@Module({ namespacedPath: 'graph/' })
export class GraphStore extends VuexModule {

    _selectedNode?: SelectedNode;

    get selectedNode() {
        return this._selectedNode;
    }

    @mutation newSelection(node: SelectedNode) {
        this._selectedNode = node;
    }

}

export const graph = GraphStore.ExtractVuexModule(GraphStore);
