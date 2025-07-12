// 📦 Imports
import React, { useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

// 🧠 Initial State & Helpers
const initialNodes = [];
const initialEdges = [];
let nodeId = 1;

const getColor = (type) => {
  switch (type) {
    case 'positive': return '#00c853';
    case 'neutral': return '#ffd600';
    case 'negative': return '#d50000';
    default: return '#6200ea'; // root
  }
};

// 🤖 AI Logic with Domino Effect Thinking (Updated: Using Puter AI API)
const createAIChildren = async (text, parentId, setNodes, setEdges) => {
  try {
    const res = await axios.post(
      'https://api.puter.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert in cause-and-effect analysis.

Given a news headline or event, break it down into a chain of consequences, like a domino effect.

Each node must:
- Be short (max 15 words)
- Represent one specific consequence
- Be categorized as either: 'positive', 'neutral', or 'negative'
- Be logically linked to the prompt

Return only 3 outputs: one of each type.`
          },
          { role: 'user', content: text }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const content = res.data.choices?.[0]?.message?.content || '';
    const lines = content.split('\n').filter(Boolean).slice(0, 3);
    const childTypes = ['positive', 'neutral', 'negative'];

    const newNodes = lines.map((line, idx) => {
      const newId = `${nodeId++}`;
      return {
        id: newId,
        data: { label: line.replace(/^\d+\.\s*/, '') },
        position: {
          x: 300 + Math.random() * 300,
          y: 200 + Math.random() * 300
        },
        style: {
          background: getColor(childTypes[idx]),
          color: '#fff',
          borderRadius: 12,
          padding: 10,
          fontWeight: 'bold',
          fontSize: 14,
          maxWidth: 300
        }
      };
    });

    const newEdges = newNodes.map((n) => ({
      id: `${parentId}-${n.id}`,
      source: parentId,
      target: n.id
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);

    // Recursively expand each child one level deep
    for (const n of newNodes) {
      await createAIChildren(n.data.label, n.id, setNodes, setEdges);
    }

  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    alert(`❌ AI Error: ${errMsg}`);
    console.error('❌ Full error:', err.response?.data || err);
  }
};


// 🔧 App Component
export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    const rootId = `${nodeId++}`;
    const rootNode = {
      id: rootId,
      data: { label: prompt },
      position: { x: 500, y: 50 },
      style: {
        background: '#6200ea',
        color: '#fff',
        borderRadius: 12,
        padding: 12,
        fontWeight: 'bold',
        fontSize: 16,
        maxWidth: 300
      }
    };

    setNodes([rootNode]);
    setEdges([]);

    await createAIChildren(prompt, rootId, setNodes, setEdges);

    setPrompt('');
    setLoading(false);
  };

  const onNodeClick = async (_event, node) => {
    await createAIChildren(node.data.label, node.id, setNodes, setEdges);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#111', display: 'flex', flexDirection: 'column' }}>
      {/* 🔝 Header */}
      <div style={{
        padding: '1rem 2rem',
        backgroundColor: '#222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.8rem' }}>🧠</span>
          <h2 style={{ color: '#fff', margin: 0 }}>NodeVerse MVP</h2>
        </div>

        {/* 🔍 Prompt Input */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a news/event prompt..."
            style={{
              padding: '10px',
              width: '300px',
              borderRadius: '8px',
              border: '1px solid #555',
              color: '#fff',
              backgroundColor: '#333'
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              backgroundColor: '#00bcd4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Thinking...' : 'Generate Node'}
          </button>
          <button
            disabled
            style={{
              padding: '10px',
              backgroundColor: '#ff4d4d',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'not-allowed'
            }}
          >
            ⏹ Stop
          </button>
        </div>
      </div>

      {/* 🧠 ReactFlow Canvas */}
      <div style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => setNodes((nds) => applyNodeChanges(changes, nds))}
          onEdgesChange={(changes) => setEdges((eds) => applyEdgeChanges(changes, eds))}
          onNodeClick={onNodeClick}
          fitView
          style={{ backgroundColor: '#1a1a1a' }}
        >
          <MiniMap style={{ backgroundColor: '#222' }} />
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
