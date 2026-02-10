import React, { useCallback, useMemo, useEffect, useState } from 'react';
import axios from 'axios';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import RouteTransition from './library/RouteTransition';
import { API_BASE_URL } from '../config';

const TopologyView = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/agents`);
        if (response.data.success) {
          const agents = response.data.data;
          
          // Create Nodes
          const newNodes = [
            {
              id: 'gateway',
              type: 'input',
              data: { label: 'Intelligence Gateway' },
              position: { x: 400, y: 0 },
              className: 'bg-blue-600 text-white font-black rounded-lg px-4 py-2 border-none shadow-lg w-48 text-center',
            },
            {
              id: 'router',
              data: { label: 'Semantic Router' },
              position: { x: 400, y: 100 },
              className: 'bg-slate-800 text-white font-bold rounded-lg px-4 py-2 border-none shadow-md w-48 text-center',
            }
          ];

          const newEdges = [
            { id: 'e-g-r', source: 'gateway', target: 'router', animated: true, style: { stroke: '#2563eb', strokeWidth: 2 } }
          ];

          // Add top 8 agents as nodes
          agents.slice(0, 8).forEach((agent, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const x = 100 + col * 200;
            const y = 250 + row * 150;
            
            const tierColor = agent.tier === 'S' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' :
                             agent.tier === 'A' ? 'bg-purple-50 border-purple-200 text-purple-900' :
                             'bg-blue-50 border-blue-200 text-blue-900';

            newNodes.push({
              id: `agent-${agent.id}`,
              data: { label: `${agent.model}\n(${agent.provider})` },
              position: { x, y },
              className: `${tierColor} font-bold rounded-lg px-3 py-2 border shadow-sm w-40 text-center text-[10px] whitespace-pre-wrap`,
            });

            newEdges.push({
              id: `e-r-${agent.id}`,
              source: 'router',
              target: `agent-${agent.id}`,
              label: agent.scenarios[0],
              labelStyle: { fontSize: 7, fill: '#94a3b8', fontWeight: 800 },
              style: { stroke: '#cbd5e1' }
            });
          });

          setNodes(newNodes);
          setEdges(newEdges);
        }
      } catch (error) {
        console.error('Failed to fetch topology data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <RouteTransition animationType="fade" duration={500}>
      <div className="w-full h-full bg-[#f8fafc] flex flex-col overflow-hidden">
        <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0 shadow-sm relative z-10">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Interactive Topology</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Dynamic Agent Network & Real-time Routing</p>
          </div>
          <div className="flex gap-2">
             <div className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest border border-blue-100">Live API</div>
             <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">Active Nodes: {nodes.length}</div>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            colorMode="light"
            defaultEdgeOptions={{ animated: true }}
          >
            <Controls />
            <MiniMap 
              nodeColor={(n) => {
                if (n.id === 'gateway') return '#2563eb';
                if (n.id === 'router') return '#1e293b';
                return '#cbd5e1';
              }}
              maskColor="rgba(248, 250, 252, 0.7)"
            />
            <Background variant="dots" gap={12} size={1} color="#cbd5e1" />
            <Panel position="top-right" className="bg-white/80 backdrop-blur-md p-2 rounded-lg border border-slate-200 shadow-sm mr-4 mt-4">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Topology Legend</p>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        <span className="text-[8px] font-bold text-slate-600 uppercase">Input Gateway</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                        <span className="text-[8px] font-bold text-slate-600 uppercase">Semantic Router</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-200 border border-blue-300"></div>
                        <span className="text-[8px] font-bold text-slate-600 uppercase">Agent Node</span>
                    </div>
                </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </RouteTransition>
  );
};

export default TopologyView;
