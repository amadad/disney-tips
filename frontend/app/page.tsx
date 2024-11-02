'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './globals.css';

export default function Home() {
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/markdown');
        setMarkdownContent(response.data.markdown);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Disney World Trip Tips</h1>
      <ReactMarkdown>{markdownContent}</ReactMarkdown>
    </div>
  );
}
