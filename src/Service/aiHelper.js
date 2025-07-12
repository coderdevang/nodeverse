// src/services/aiHelper.js
import axios from 'axios';

const API_KEY = 'Bearer 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'; // Replace with your actual API key
const API_URL = 'https://openrouter.ai/api/v1/chat/completions ';
const MODEL = 'meta-llama/llama-3.1-405b-instruct:free';
const SYSTEM_PROMPT = `You are an economic impact analyst. Given a news headline, provide 3 effects: one positive, one neutral, and one negative, each short and clear.`;

const getColor = (type) => {
  switch (type) {
    case 'positive': return '#00c853';
    case 'neutral': return '#ffd600';
    case 'negative': return '#d50000';
    default: return '#6200ea'; // root node
  }
};

export const generateAIChildren = async (text, parentId, setNodes, setEdges, nodeIdRef, depth = 2) => {
  if (depth < 1) return; // Stop recursion if depth <= 0

  try {
    const res = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = res.data.choices?.[0]?.message?.content || '';
    const lines = content.split('\n').filter(Boolean).slice(0, 3);
    const childTypes = ['positive', 'neutral', 'negative'];

    const newNodes = lines.map((line, idx) => {
      const id = `${nodeIdRef.current++}`;
      return {
        id,
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

    // Update nodes and edges
    setNodes(prevNodes => [...prevNodes, ...newNodes]);
    setEdges(prevEdges => [...prevEdges, ...newEdges]);

    // Recursive expansion with depth limit
    for (const n of newNodes) {
      await generateAIChildren(n.data.label, n.id, setNodes, setEdges, nodeIdRef, depth - 1);
    }

  } catch (err) {
    console.error('❌ AI Expansion Error:', err.response || err.message);
    alert('Something went wrong while expanding this node.');
  }
};