export interface Edge {
    score: number;
    length: number;
    label: number;
}

class Vertex {
    edges: Edge[];
    score = -Infinity;
    backtraceVertex: Vertex | null = null;
    backtraceEdge: Edge | null = null;

    constructor(edges: Edge[], score: number) {
        this.edges = edges;
        this.score = score;
    }
}

class Graph {
    vertices: Vertex[];

    constructor(edgeLists: Edge[][]) {
        const vertexCount = edgeLists.length;

        // NOTE: using label value of -1 as sentinel for no label.
        const defaultEdge = { score: 0, length: 1, label: -1 };
        this.vertices = edgeLists.map((edges, index) => {
            const score = index === 0 ? 0 : -Infinity;
            return new Vertex([defaultEdge, ...edges], score);
        });
        this.vertices.push(new Vertex([], -Infinity));

        // this.vertices = edgeLists.map((edges, index) => {
        //     const filteredEdges = edges.filter((edge) => 
        //         index + edge.length < vertexCount);
        //     if (index === vertexCount - 1) {
        //         // No default edge from final vertex.
        //         return new Vertex(filteredEdges);
        //     }
        //     else {
        //         // Other vertices get default edge to following vertex.
        //         return new Vertex([defaultEdge, ...filteredEdges]);
        //     }
        // });
    }

    findPath() {
        // Forward propate paths.
        this.vertices.forEach((vertex, index) => {
            vertex.edges.forEach((edge) => {
                const targetIndex = index + edge.length;
                if (targetIndex < this.vertices.length) {
                    const target = this.vertices[targetIndex];
                    const newScore = vertex.score + edge.score;
                    if (target.score < newScore) {
                        target.score = newScore;
                        target.backtraceVertex = vertex;
                        target.backtraceEdge = edge;
                    }   
                }
            });
        });

        // Extract path by walking backwards from last vertex.
        const reversePath = [];
        let current = this.vertices[this.vertices.length - 1];
        while (current.backtraceVertex) {
            reversePath.push(current.backtraceEdge as Edge);
            current = current.backtraceVertex;
        }

        const forwardPath = reversePath.reverse();

        return forwardPath;
    }
}

export function findBestPath(edgeLists: Edge[][]) {
    const graph = new Graph(edgeLists);
    return graph.findPath();
}