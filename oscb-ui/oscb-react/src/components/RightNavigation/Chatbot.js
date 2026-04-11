import React, { useState, useRef, useEffect, startTransition } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTrash, faRobot, faDownload, faRotateRight, faMagic, faMinus, faExpand, faAnchor, faChevronUp, faPaperclip, faTimes, faFile, faFilePdf, faFileImage, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { NODE_API_URL } from '../../constants/declarations';

import styled from 'styled-components';
import SingleCellLogo from '../../assets/single-cell-logo.png';

import ReactMarkdown from "react-markdown"
import 'github-markdown-css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm';
// import rehypeRaw from 'rehype-raw'
import rehypeGithubAlerts from 'rehype-github-alert'
import { CopyToClipboard } from 'react-copy-to-clipboard';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { visit } from 'unist-util-visit';
import { getCookie } from '../../utils/utilFunctions';
const jwtToken = getCookie('jwtToken');

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  cursor: nw-resize;
  z-index: 20;
  
  &::after {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    width: 6px;
    height: 6px;
    border-top: 2px solid #cbd5e1;
    border-left: 2px solid #cbd5e1;
  }

  &:hover::after {
    border-color: #64748b;
  }
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  background-color: #ffffff;
  z-index: 10;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
`;

const MinimizedButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: transparent;
  color: white;
  border: none;
  /* box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4); */
  cursor: pointer;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    transform: scale(1.05);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AvatarCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);
`;

const TitleText = styled.h3`
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
`;

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #22c55e;
`;

const StatusText = styled.span`
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const IconButton = styled.button`
  color: #94a3b8;
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #0f766e;
    background-color: #f0fdfa;
  }
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  opacity: 0.8;
  gap: 16px;
`;

const EmptyIconWrapper = styled.div`
  width: 64px;
  height: 64px;
  background-color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #14b8a6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  border: 1px solid #f0f9ff;
`;

// const SuggestedQuestionsContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 8px;
//   width: 100%;
//   margin-top: 16px;
// `;

const SuggestedQuestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 0 16px 32px; /* Indent to align with bot bubbles */
  animation: fadeIn 0.4s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const SuggestionChip = styled.button`
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);

  &:hover {
    border-color: #0f766e;
    color: #0f766e;
    background-color: #f0fdfa;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  }

  svg {
    color: #94a3b8;
    transition: color 0.2s;
  }
  
  &:hover svg {
    color: #0f766e;
  }
`;

const MessageRow = styled.div`
  display: flex;
  width: 100%;
  justify-content: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
`;

const MessageGroup = styled.div`
  display: flex;
  max-width: 85%;
  align-items: flex-end;
  flex-direction: ${props => props.$isUser ? 'row-reverse' : 'row'};
  gap: 8px;
`;

const BotAvatarSmall = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #0f766e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  margin-bottom: 4px;
`;



const Bubble = styled.div`
  padding: 12px 16px;
  font-size: 1em;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  white-space: pre-wrap;
  max-width: 100%;
  
  ${props => props.$isUser ? `
    background-color: #0f766e; /* Teal-700 equivalent */
    color: white;
    border-radius: 18px 18px 2px 18px;
  ` : `
    background-color: white;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    border-radius: 18px 18px 18px 2px;
  `}
`;

const ThinkingBubble = styled.div`
  background-color: white;
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  border-radius: 18px 18px 18px 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`;

const Dot = styled.div`
  width: 4px;
  height: 4px;
  background-color: #94a3b8;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
  
  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;

const InputArea = styled.div`
  padding: 16px;
  background-color: white;
  border-top: 1px solid #f1f5f9;
`;

const InputWrapper = styled.div`
  position: relative;
  /* group equivalent not needed, child focus works */
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  padding-left: ${props => props.$hasFile ? '16px' : '48px'}; /* Make space for paperclip if no file, usually paperclip is outside or inside */
  padding-left: 48px; /* Always space for paperclip */
  padding-right: 90px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-family: inherit;
  font-size: 1em;
  color: #334155;
  resize: none;
  min-height: 52px;
  outline: none;
  transition: all 0.2s;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);

  &:focus {
    background-color: white;
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const AttachButton = styled.button`
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 8px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: #94a3b8;

  &:hover {
    color: #0f766e;
    background-color: #f0fdfa;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SendButton = styled.button`
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 8px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  ${props => props.disabled ? `
    background-color: transparent;
    color: #cbd5e1;
    cursor: not-allowed;
  ` : `
    background-color: #0f766e;
    color: white;
    box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2);
    
    &:hover {
      background-color: #115e59;
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
  `}
`;

const TrashButton = styled.button`
  position: absolute;
  right: 50px;
  bottom: 8px;
  padding: 8px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: #94a3b8;

  &:hover {
    color: #ef4444;
    background-color: #fef2f2;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const FooterRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
`;

const SelectWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  &:hover svg {
    color: #0f766e;
  }
`;

const ModelSelect = styled.select`
  appearance: none;
  background-color: transparent;
  border: none;
  padding: 4px 24px 4px 0;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  outline: none;
  transition: color 0.2s;

  &:hover {
    color: #0f766e;
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  right: 0;
  pointer-events: none;
  color: #94a3b8;
  transition: color 0.2s;
`;

const Disclaimer = styled.span`
  font-size: 10px;
  color: #cbd5e1;
  font-weight: 500;
  font-size: 10px;
  color: #cbd5e1;
  font-weight: 500;
`;

const ScrollTopButton = styled.button`
  position: fixed; /* Fixed usually works better for "Scroll to Top" */
  bottom: 230px;
  right: 40px;
  
  /* To make it a circle: */
  width: 25px; 
  height: 32px;
  border-radius: 50%; /* 50% on a square makes a circle */
  
  background-color: ${props => props.theme.bg};
  color: ${props => props.theme.subtext};
  border: 1px solid ${props => props.theme.border};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  
  /* Smooth visibility toggle */
  transition: all 0.2s ease-in-out;
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  transform: scale(${props => props.$visible ? 1 : 0.8});

  &:hover {
    color: ${props => props.theme.bubbleUser};
    transform: scale(1.1); /* Subtle grow effect instead of just moving */
    background-color: ${props => props.theme.bgHover || props.theme.bg};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const FilePreviewChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f1f5f9;
  border-radius: 8px;
  padding: 6px 10px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #475569;
  border: 1px solid #e2e8f0;
  width: fit-content;
  max-width: 100%;
`;

const FileIconWrapper = styled.div`
  color: #64748b;
`;

const FileName = styled.span`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;

  &:hover {
    color: #ef4444;
  }
`;

const ImagePreview = styled.img`
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
`;

// --- Component ---

const Chatbot = (presetQuestions = null) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt'); // 'gpt' or 'gemini'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isMinimized, setIsMinimized] = useState(() => {
    const savedState = localStorage.getItem('chatbot_minimized');
    return savedState === 'true';
  });
  const [isDocked] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const textAreaRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const messagesAreaRef = useRef(null); // Attach this to your MessagesArea
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [userId, setUserId] = useState('anonymous');

  // Function to stop the generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    setShowScrollTop(scrollTop > 300); // Show button after 300px of scrolling
  };

  const scrollToTop = () => {
    messagesAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-expand textarea effect
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // console.log("presetQuestions: ", presetQuestions);
  // console.log("presetQuestions?.presetQuestions: ", presetQuestions?.presetQuestions);
  // console.log("", presetQuestions ?.presetQuestions?.presetQuestions);

  const presetQuestionsList =
    presetQuestions?.presetQuestions?.presetQuestions ||
    presetQuestions?.presetQuestions ||
    null;

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
      setMessages(JSON.parse(storedHistory));
    }

    const fetchUserInfo = async () => {
      if (!jwtToken) return;
      try {
        const res = await fetch(NODE_API_URL + "/protected", { headers: { Authorization: `Bearer ${jwtToken}` } });
        const data = await res.json();
        if (data?.authData) { setUserId(data.authData.username); }
      }
      catch (e) { console.error(e); }
    };
    fetchUserInfo();
  }, []);

  // Save chat history to localStorage whenever messages update
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatbot_minimized', isMinimized);
  }, [isMinimized]);

  // Resize state
  const [size, setSize] = useState({ width: 380, height: 600 });
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0 });

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // };

  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  useEffect(() => {
    // Use a slight delay to ensure Markdown and Code blocks have calculated their height
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isLoading]); // Fires when user sends (loading starts) AND when AI finishes (loading ends)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      if (Number.isFinite(startSize.current.w - deltaX) && Number.isFinite(startSize.current.h - deltaY)) {
        setSize({
          width: Math.max(300, startSize.current.w - deltaX),
          height: Math.max(400, startSize.current.h - deltaY)
        });
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResize = (e) => {
    e.preventDefault();
    isResizing.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { w: size.width, h: size.height };
    document.body.style.cursor = 'nw-resize';
    document.body.style.userSelect = 'none';
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (file) => {
    if (!file) return faFile;
    if (file.type === "application/pdf") return faFilePdf;
    if (file.type.startsWith("image/")) return faFileImage;
    if (file.type.startsWith("text/")) return faFileAlt;
    return faFile;
  };

  const handleSend = async (directInput = null) => {
    // Ensure we are working with a string
    const source = typeof directInput === 'string' ? directInput : input;
    const textToSend = (source || '').trim();
    if (!textToSend && !selectedFile) return;
    console.log("textToSend:", textToSend);
    // console.log("Sending message: ", textToSend, " with file: ", selectedFile);
    let userContent = textToSend;
    if (selectedFile) {
      userContent += ` [Attached: ${selectedFile.name}]`;
    }

    // Create new controller for this specific request
    abortControllerRef.current = new AbortController();

    const userMessage = { role: 'user', content: userContent };
    startTransition(() => {
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      // Clear file selection UI immediately for better UX
      setSelectedFile(null);
    });
    // Don't clear selectedFile yet, we need it for the API call
    setIsLoading(true);

    const targetModel = selectedModel; // Capture current model
    const fileToSend = selectedFile; // Capture file

    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const formData = new FormData();
      formData.append('message', userContent);
      formData.append('model', targetModel);
      if (fileToSend) {
        formData.append('file', fileToSend);
      }
      formData.append('userId', userId); // Include userId in the form data

      const response = await axios.post(`${NODE_API_URL}/api/chat`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // 'Authorization': `Bearer ${jwtToken}`,
        },
        signal: abortControllerRef.current.signal
      });

      const botMessage = { role: 'assistant', content: response.data.reply };
      console.log("Bot message received: ", botMessage);
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request canceled by user.");
        setMessages(prev => [...prev, "Request canceled by user."]);
      } else {
        console.error("Chat error:", error);
        let messageContent = "Sorry, something went wrong. Please check your API keys in oscb-node/.env.";

        if (error.response) {
          if (error.response.status === 429) {
            messageContent = "You have exceeded the API quota (Rate Limit). Please wait a moment before trying again.";
          } else if (error.response.data && error.response.data.details) {
            messageContent = `Error: ${error.response.data.details}`;
          }
        }
        const errorMessage = { role: 'assistant', content: messageContent };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <MinimizedButton onClick={() => setIsMinimized(false)} title="AI Assistant">
        <img src={SingleCellLogo} alt="AI" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
      </MinimizedButton>
    );
  }

  const handleCopy = (index) => {
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
  };

  let codeBlockIndex = -1;

  const handleDownloadChat = () => {
    if (messages.length === 0) return;

    // Format the messages into a text string
    const timestamp = new Date().toLocaleString();
    let content = `Chat Export - ${timestamp}\n`;
    content += "=".repeat(30) + "\n\n";

    messages.forEach((msg, i) => {
      const role = msg.role === 'user' ? 'USER' : 'AI ASSISTANT';
      content += `[${role}]:\n${msg.content}\n\n`;
      content += "-".repeat(20) + "\n\n";
    });

    // Create a blob and trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `single-cell_analysis_chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Custom plugin to strip CR/LF from text nodes in the HTML tree
  const rehypeMinifyHtml = () => {
    return (tree) => {
      visit(tree, 'text', (node, index, parent) => {
        // Don't minify if inside code or pre
        if (parent && ['code', 'pre'].includes(parent.tagName)) return;
        // Replace multiple newlines/spaces with a single space
        node.value = node.value.replace(/[\r\n]+/gm, ' ');
      });
    };
  };

  return (
    <Container
      style={{
        // width: isDocked ? '600px' : `${size.width}px`,
        // height: isDocked ? '500px' : `${size.height}px`,
        width: isFullScreen ? 'calc(100% - 48px)' : isDocked ? '600px' : `${size.width}px`,
        height: isFullScreen ? 'calc(100% - 48px)' : isDocked ? '500px' : `${size.height}px`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth expansion
        right: isDocked ? '24px' : '24px',
        bottom: isDocked ? '0px' : '24px',
        borderBottomRightRadius: isDocked ? '0' : '16px',
        borderBottomLeftRadius: isDocked ? '0' : '16px',
        fontSize: size.width > 600 ? '18px' : size.width > 450 ? '16px' : '14px' // Enhanced responsive font size
      }}
    >
      {!isDocked && <ResizeHandle onMouseDown={startResize} title="Drag to resize" />}
      <Header>
        <HeaderTitleGroup>
          <AvatarCircle style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src={SingleCellLogo} alt="AI" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </AvatarCircle>
          <div>
            <TitleText>AI Assistant</TitleText>
            <StatusIndicator>
              <StatusDot />
              <StatusText>Online</StatusText>
            </StatusIndicator>
          </div>
        </HeaderTitleGroup>

        <HeaderActions>
          <IconButton onClick={() => setIsMinimized(true)} title="Minimize">
            <FontAwesomeIcon icon={faMinus} size="sm" />
          </IconButton>
          <IconButton onClick={() => setIsFullScreen(!isFullScreen)} title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
            <FontAwesomeIcon icon={isFullScreen ? faAnchor : faExpand} size="sm" />
          </IconButton>
          <IconButton
            onClick={handleDownloadChat}
            title="Download Chat Transcript"
            disabled={messages.length === 0}
            style={{ opacity: messages.length === 0 ? 0.5 : 1 }}
          >
            <FontAwesomeIcon icon={faDownload} size="sm" />
          </IconButton>
        </HeaderActions>
      </Header>

      <MessagesArea
        ref={messagesAreaRef}
        onScroll={handleScroll}>
        {messages.length === 0 && (
          <EmptyState>
            <EmptyIconWrapper>
              <FontAwesomeIcon icon={faMagic} size="lg" />
            </EmptyIconWrapper>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#334155' }}>How can I help you?</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', maxWidth: '800px', lineHeight: '1.5' }}>
                I can answer questions about single-cell sequencing analysis. This AI assistant may occasionally generate incorrect or misleading information. We are not responsible for any decisions made based on the generated content. Please verify critical information independently.
              </p>
            </div>
          </EmptyState>
        )}

        {messages.map((msg, index) => (
          <MessageRow
            key={index}
            $isUser={msg.role === 'user'}
            ref={index === messages.length - 1 && !isLoading ? messagesEndRef : null}
          >
            <MessageGroup $isUser={msg.role === 'user'}>
              {/* Bot Avatar */}
              {msg.role !== 'user' && (
                <BotAvatarSmall>
                  <FontAwesomeIcon icon={faRobot} size="xs" />
                </BotAvatarSmall>
              )}

              {/* Bubble */}
              <Bubble $isUser={msg.role === 'user'}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeGithubAlerts, rehypeKatex, rehypeMinifyHtml]}
                  children={msg.content} // Reduce multiple newlines to single
                  components={{
                    // Reduce spacing between paragraphs
                    h1: ({ children }) => (
                      <h1 style={{ marginTop: '0', marginBottom: '0', lineHeight: '1.2' }}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 style={{ marginTop: '0', marginBottom: '0', lineHeight: '1.2' }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 style={{ marginTop: '0', marginBottom: '0', lineHeight: '1.2' }}>
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p style={{ marginTop: '0', marginBottom: '0', lineHeight: '1.2' }}>
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => <ul style={{ marginTop: '0', marginBottom: '0', paddingLeft: '20px' }}>{children}</ul>,
                    li: ({ children }) => <li style={{ marginTop: '0', lineHeight: '1.2', marginBottom: '0' }}>{children}</li>,
                    code(props) {
                      const { children, inline, className, node, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      if (!inline && match) {
                        codeBlockIndex++;

                        const currentIndex = codeBlockIndex;
                        const codeText = String(children).replace(/\n$/, '');

                        return (
                          <div style={{ position: 'relative' }}>
                            <SyntaxHighlighter
                              {...rest}
                              PreTag="div"
                              children={codeText}
                              language={match[1]}
                              style={dark}
                              codeTagProps={{ style: { fontSize: '13px', lineHeight: '1.4' } }} // Cleaner for long code
                            />
                            <CopyToClipboard text={codeText} onCopy={() => handleCopy(currentIndex)}>
                              <button style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                background: '#333',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                padding: '5px 10px',
                              }}>{copiedIndex === currentIndex ? 'Copied!' : 'Copy'}</button>
                            </CopyToClipboard>
                          </div>
                        );
                      }

                      // Fallback for inline code or unknown language
                      return (
                        <code {...rest} className={className}>
                          {children}
                        </code>
                      );
                    }
                  }}
                />
              </Bubble>
            </MessageGroup>
          </MessageRow>
        ))}

        {isLoading && (
          <MessageRow $isUser={false}>
            <MessageGroup $isUser={false}>
              <BotAvatarSmall>
                <FontAwesomeIcon icon={faRobot} size="xs" />
              </BotAvatarSmall>
              <ThinkingBubble>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Thinking</span>
                    <div style={{ display: 'flex', gap: '2px' }}><Dot /><Dot /><Dot /></div>
                  </div>

                  <button
                    onClick={handleStopGeneration}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#ef4444',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    STOP
                  </button>
                </div>
              </ThinkingBubble>
            </MessageGroup>
          </MessageRow>
        )}

        {!isLoading && (
          <SuggestedQuestionsContainer>
            {Array.isArray(presetQuestionsList) && presetQuestionsList.map((q, idx) => (
              <SuggestionChip key={idx} onClick={() => {
                const prompt = q.prompt;
                setInput(prompt); // Update UI
                handleSend(prompt); // Trigger API call immediately with the correct text
              }}>
                <FontAwesomeIcon icon={faMagic} size="xs" />
                <span style={{ fontWeight: 500 }}>{q.title}</span>
              </SuggestionChip>
            ))}
          </SuggestedQuestionsContainer>
        )}
        {isLoading && (<div ref={messagesEndRef} />)}
      </MessagesArea>

      <ScrollTopButton
        $visible={showScrollTop}
        onClick={scrollToTop}
        title="Scroll to Top"
      >
        <FontAwesomeIcon icon={faChevronUp} size="xs" />
      </ScrollTopButton>

      <InputArea>
        {selectedFile && (
          <FilePreviewChip>
            <FileIconWrapper>
              {selectedFile.type.startsWith('image/') ? (
                <ImagePreview src={URL.createObjectURL(selectedFile)} alt="preview" />
              ) : (
                <FontAwesomeIcon icon={getFileIcon(selectedFile)} />
              )}
            </FileIconWrapper>
            <FileName>{selectedFile.name}</FileName>
            <RemoveFileButton onClick={removeFile}>
              <FontAwesomeIcon icon={faTimes} />
            </RemoveFileButton>
          </FilePreviewChip>
        )}
        <InputWrapper>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept=".txt,.csv,.json,.js,.py,.pdf,image/*,.docx,.xlsx,.pptx,.md,.odt,.odp,.ods,.rtf"
          />
          <AttachButton onClick={() => fileInputRef.current?.click()} title="Attach file">
            <FontAwesomeIcon icon={faPaperclip} size="sm" />
          </AttachButton>
          {/* <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows="1"
          /> */}

          <TextArea
            ref={textAreaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows="1"
            style={{ maxHeight: '200px', overflowY: 'auto' }} // Prevents it from taking over the screen
            $hasFile={!!selectedFile}
          />
          <TrashButton
            onClick={handleClear}
            title="Clear chat history"
            style={{ display: messages.length > 0 ? 'flex' : 'none' }}
          >
            <FontAwesomeIcon icon={faTrash} size="sm" />
          </TrashButton>
          <SendButton
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedFile)}
          >
            <FontAwesomeIcon icon={faPaperPlane} size="sm" />
          </SendButton>
        </InputWrapper>

        <FooterRow>
          <SelectWrapper>
            <ModelSelect
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="gpt">GPT-4o (OpenAI)</option>
              <option value="gemini">Gemini Flash (Latest) (Google)</option>
            </ModelSelect>
            <IconWrapper>
              <FontAwesomeIcon icon={faRotateRight} rotation={90} size="xs" />
            </IconWrapper>
          </SelectWrapper>
          <Disclaimer>Powered by AI. Please use this content with caution.</Disclaimer>
        </FooterRow>
      </InputArea>
    </Container >
  );
};

export default Chatbot;
