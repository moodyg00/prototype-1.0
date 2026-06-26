'use client';

import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeTypes,
  type Node,
  type Edge,
  type NodeProps,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { WorkflowNodeData } from '../../lib/workflow/types';
import { CATALOG_BY_TYPE } from '../../lib/workflow/node-catalog';
import { WorkflowNodeComponent } from './WorkflowNodeComponent';

const nodeTypes: NodeTypes = {
  // Cast needed: React Flow NodeTypes constraint uses base Record type
  workflowNode: WorkflowNodeComponent as React.ComponentType<NodeProps>,
};

interface WorkflowCanvasProps {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  onChange: (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => void;
  onNodeSelect: (node: Node<WorkflowNodeData> | null) => void;
  selectedNodeId: string | null;
  readonly?: boolean;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onChange,
  onNodeSelect,
  selectedNodeId,
  readonly = false,
}: WorkflowCanvasProps) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Refs for stale-closure-safe access in event callbacks
  const rfNodesRef = useRef(rfNodes);
  const rfEdgesRef = useRef(rfEdges);
  React.useEffect(() => { rfNodesRef.current = rfNodes; }, [rfNodes]);
  React.useEffect(() => { rfEdgesRef.current = rfEdges; }, [rfEdges]);

  // Track what we last sent to parent so we don't re-sync our own echoes
  const lastSentRef = useRef<{ nodes: Node<WorkflowNodeData>[]; edges: Edge[] }>({ nodes, edges });

  // Sync when parent pushes externally-changed data (e.g. inspector property update).
  // Skip if the incoming prop is what we just sent — avoids the parent-echo loop.
  React.useEffect(() => {
    if (nodes !== lastSentRef.current.nodes) {
      setRfNodes(nodes);
    }
  }, [nodes, setRfNodes]);

  React.useEffect(() => {
    if (edges !== lastSentRef.current.edges) {
      setRfEdges(edges);
    }
  }, [edges, setRfEdges]);

  // Notify parent and record what we sent to prevent re-sync on the echo
  const notifyChange = useCallback(
    (nextNodes: Node<WorkflowNodeData>[], nextEdges: Edge[]) => {
      lastSentRef.current = { nodes: nextNodes, edges: nextEdges };
      onChange(nextNodes, nextEdges);
    },
    [onChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          id: `e-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
        },
        rfEdgesRef.current,
      );
      setRfEdges(newEdges);
      notifyChange(rfNodesRef.current, newEdges);
    },
    [setRfEdges, notifyChange],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const typeId = event.dataTransfer.getData('application/workflow-node-type');
      if (!typeId || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const typeDef = CATALOG_BY_TYPE[typeId];
      if (!typeDef) return;

      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      const id = `${typeId}-${Date.now()}`;
      const newNode: Node<WorkflowNodeData> = {
        id,
        type: 'workflowNode',
        position: { x, y },
        data: {
          typeId,
          label: typeDef.label,
          properties: Object.fromEntries(
            typeDef.properties.map(p => [p.key, p.default ?? '']),
          ),
          handles: typeDef.handles,
          category: typeDef.category,
          color: typeDef.color,
          icon: typeDef.icon,
        },
      };

      const updated = [...rfNodesRef.current, newNode];
      setRfNodes(updated);
      notifyChange(updated, rfEdgesRef.current);
    },
    [setRfNodes, notifyChange],
  );

  // Notify parent after drag completes (positions updated in rfNodesRef by then)
  const onNodeDragStop = useCallback(() => {
    notifyChange(rfNodesRef.current, rfEdgesRef.current);
  }, [notifyChange]);

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      const deletedIds = new Set(deletedNodes.map(n => n.id));
      const remaining = rfNodesRef.current.filter(n => !deletedIds.has(n.id));
      notifyChange(remaining, rfEdgesRef.current);
    },
    [notifyChange],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      const deletedIds = new Set(deletedEdges.map(e => e.id));
      const remaining = rfEdgesRef.current.filter(e => !deletedIds.has(e.id));
      notifyChange(rfNodesRef.current, remaining);
    },
    [notifyChange],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node as Node<WorkflowNodeData>);
    },
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.07)"
        />
        <Controls
          className="!bg-zinc-900 !border-white/10 !rounded-lg"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-zinc-900 !border-white/10 !rounded-lg"
          nodeColor={(n) => {
            const d = n.data as WorkflowNodeData;
            return d.color ?? '#6366f1';
          }}
          maskColor="rgba(0,0,0,0.5)"
        />
        {selectedNodeId && (
          <Panel position="top-left" className="pointer-events-none">
            <div className="text-[10px] text-zinc-500 font-mono px-2 py-1 bg-zinc-900/70 rounded border border-white/5">
              {selectedNodeId}
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
