import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GetFolderTree } from '../../wailsjs/go/main/App';
import { HiXMark } from 'react-icons/hi2';

interface FolderNode {
  name: string;
  path: string;
  isProject: boolean;
  children: FolderNode[];
  fileCount: number;
}

interface EntityRendererProps {
  folderPath: string;
  onClose: () => void;
}

const EntityRenderer: React.FC<EntityRendererProps> = ({ folderPath, onClose }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildNodesAndEdges = useCallback((tree: FolderNode) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let nodeId = 0;

    const NODE_MIN_WIDTH = 150;
    const NODE_PADDING = 30;
    const HORIZONTAL_GAP = 40;
    const VERTICAL_SPACING = 120;

    // Calculate width needed for a node based on its name
    const getNodeWidth = (name: string): number => {
      const estimatedCharWidth = 8;
      const textWidth = name.length * estimatedCharWidth;
      return Math.max(NODE_MIN_WIDTH, textWidth + NODE_PADDING);
    };

    // First pass: calculate subtree widths
    const calculateSubtreeWidth = (node: FolderNode): number => {
      const nodeWidth = getNodeWidth(node.name);

      if (!node.children || node.children.length === 0) {
        return nodeWidth;
      }

      const childrenTotalWidth = node.children.reduce((sum, child, index) => {
        const childWidth = calculateSubtreeWidth(child);
        return sum + childWidth + (index > 0 ? HORIZONTAL_GAP : 0);
      }, 0);

      return Math.max(nodeWidth, childrenTotalWidth);
    };

    // Store subtree widths
    const subtreeWidths = new Map<FolderNode, number>();
    const computeWidths = (node: FolderNode) => {
      subtreeWidths.set(node, calculateSubtreeWidth(node));
      node.children?.forEach(computeWidths);
    };
    computeWidths(tree);

    // Second pass: position nodes
    const processNode = (
      node: FolderNode,
      parentId: string | null,
      centerX: number,
      y: number
    ) => {
      const currentId = `node-${nodeId++}`;
      const nodeWidth = getNodeWidth(node.name);

      // Create node centered at centerX
      newNodes.push({
        id: currentId,
        position: { x: centerX - nodeWidth / 2, y },
        data: {
          label: (
            <div className="flex flex-col items-center text-center">
              <span className="font-medium text-sm whitespace-nowrap">{node.name}</span>
              {node.fileCount > 0 && (
                <span className="text-xs text-gray-500 whitespace-nowrap">{node.fileCount} files</span>
              )}
            </div>
          ),
        },
        style: {
          background: node.isProject ? '#FEE2E2' : '#E0F2FE',
          border: node.isProject ? '2px solid #EF4444' : '1px solid #0EA5E9',
          borderRadius: '8px',
          padding: '10px 15px',
          width: nodeWidth,
          minWidth: NODE_MIN_WIDTH,
        },
      });

      // Create edge to parent
      if (parentId) {
        newEdges.push({
          id: `edge-${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
          },
          style: { stroke: '#94A3B8' },
        });
      }

      // Process children
      if (node.children && node.children.length > 0) {
        // Calculate total width needed for all children
        const childWidths = node.children.map(child => subtreeWidths.get(child) || NODE_MIN_WIDTH);
        const totalChildrenWidth = childWidths.reduce((sum, w, i) => sum + w + (i > 0 ? HORIZONTAL_GAP : 0), 0);

        // Start position for first child
        let childX = centerX - totalChildrenWidth / 2;

        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          const childSubtreeWidth = childWidths[i];
          const childCenterX = childX + childSubtreeWidth / 2;

          processNode(child, currentId, childCenterX, y + VERTICAL_SPACING);

          childX += childSubtreeWidth + HORIZONTAL_GAP;
        }
      }
    };

    const rootSubtreeWidth = subtreeWidths.get(tree) || NODE_MIN_WIDTH;
    processNode(tree, null, rootSubtreeWidth / 2 + 50, 50);

    return { nodes: newNodes, edges: newEdges };
  }, []);

  useEffect(() => {
    const loadTree = async () => {
      try {
        setLoading(true);
        setError(null);
        const tree = await GetFolderTree(folderPath, 5);
        if (tree) {
          const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(tree);
          setNodes(newNodes);
          setEdges(newEdges);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load folder tree');
      } finally {
        setLoading(false);
      }
    };

    loadTree();
  }, [folderPath, buildNodesAndEdges, setNodes, setEdges]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold">Entity Map</h2>
            <p className="text-sm text-gray-500 truncate max-w-[500px]">{folderPath}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400"></span>
                Folder
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-100 border-2 border-red-500"></span>
                Project
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-gray-600">Loading folder structure...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-red-500">Error: {error}</div>
            </div>
          )}
          {!loading && !error && (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background />
              <Controls />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntityRenderer;
