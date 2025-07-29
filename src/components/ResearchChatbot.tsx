import React, { useState, useEffect, Fragment } from 'react';
import { RatingData } from '../utils/api';

interface AnalysisData {
  type: 'design-preferences' | 'category-preferences' | 'class-variations';
  analysis: any;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  data?: AnalysisData; // For structured data responses
}

interface ResearchChatbotProps {
  ratings: RatingData[];
  summary: any;
}

const ResearchChatbot: React.FC<ResearchChatbotProps> = ({ ratings, summary }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Add welcome message on component mount
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: `👋 Welcome! I'm your research assistant for vibration design analysis. I can help you explore how different vibration designs perform across various sound categories and classes.

I have access to data from ${summary.totalEntries} ratings across ${summary.uniqueAudioFiles} audio files, and I can analyze preferences for 4 different vibration designs: freqshift, hapticgen, percept, and pitchmatch.

What would you like to know about? You can ask me about design preferences, category analysis, or class variations!`,
      isUser: false,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [summary]);

  // Predefined questions and answers
  const predefinedQuestions = [
    {
      question: "Which vibration designs are consistently preferred?",
      keywords: ["preferred", "consistently", "best", "top", "designs"]
    },
    {
      question: "Are there category-specific design preferences?",
      keywords: ["category", "specific", "preferences", "categories"]
    },
    {
      question: "Do preferences vary significantly across classes?",
      keywords: ["classes", "vary", "significantly", "across"]
    }
  ];

  // Analyze data for answers
  const analyzeDesignPreferences = () => {
    const designs = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
    const designStats = designs.map(design => {
      const designData = ratings.filter(r => r.design === design);
      const avgRating = designData.reduce((sum, r) => sum + r.rating, 0) / designData.length;
      const stdDev = Math.sqrt(
        designData.reduce((sum, r) => sum + Math.pow(r.rating - avgRating, 2), 0) / designData.length
      );
      return { design, avgRating, stdDev, count: designData.length };
    });

    const sortedByRating = [...designStats].sort((a, b) => b.avgRating - a.avgRating);
    const mostConsistent = [...designStats].sort((a, b) => a.stdDev - b.stdDev);

    return {
      topDesign: sortedByRating[0],
      mostConsistent: mostConsistent[0],
      allDesigns: sortedByRating
    };
  };

  const analyzeCategoryPreferences = () => {
    const categories = [...new Set(ratings.map(r => r.category))];
    const categoryAnalysis = categories.map(category => {
      const categoryData = ratings.filter(r => r.category === category);
      const designs = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
      const designStats = designs.map(design => {
        const designData = categoryData.filter(r => r.design === design);
        const avgRating = designData.reduce((sum, r) => sum + r.rating, 0) / designData.length;
        return { design, avgRating };
      });
      const topDesign = designStats.reduce((best, current) => 
        current.avgRating > best.avgRating ? current : best
      );
      return { category, topDesign, allDesigns: designStats };
    });

    return categoryAnalysis;
  };

  const analyzeClassVariations = () => {
    const classes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const classAnalysis = classes.map(classCode => {
      const classData = ratings.filter(r => r.class === classCode);
      const designs = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
      const designStats = designs.map(design => {
        const designData = classData.filter(r => r.design === design);
        const avgRating = designData.reduce((sum, r) => sum + r.rating, 0) / designData.length;
        return { design, avgRating };
      });
      const topDesign = designStats.reduce((best, current) => 
        current.avgRating > best.avgRating ? current : best
      );
      return { class: classCode, topDesign, allDesigns: designStats };
    });

    // Calculate variation across classes
    const globalAverages = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'].map(design => {
      const designData = ratings.filter(r => r.design === design);
      return {
        design,
        avgRating: designData.reduce((sum, r) => sum + r.rating, 0) / designData.length
      };
    });

    return { classAnalysis, globalAverages };
  };

  const generateAnswer = (question: string): { text: string; data?: AnalysisData } => {
    const lowerQuestion = question.toLowerCase();
    
    // Check for greetings and friendly responses
    if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || 
        lowerQuestion.includes('hey') || lowerQuestion.includes('who are you') ||
        lowerQuestion.includes('what are you')) {
      return {
        text: `👋 Hi there! I'm your research assistant for vibration design analysis. I can help you explore how different vibration designs perform across various sound categories and classes.

I have access to data from ${summary.totalEntries} ratings across ${summary.uniqueAudioFiles} audio files, and I can analyze preferences for 4 different vibration designs: freqshift, hapticgen, percept, and pitchmatch.

What would you like to know about? You can ask me about design preferences, category analysis, or class variations!`
      };
    }
    
    // Check for random text or short inputs - show category analysis as default
    if (question.length < 10 || /^[^a-zA-Z]*$/.test(question)) {
      const analysis = analyzeCategoryPreferences();
      return {
        text: `Here's a quick overview of category-specific design preferences:`,
        data: {
          type: 'category-preferences',
          analysis: analysis
        }
      };
    }
    
    // Check for category-specific questions first (more specific)
    if (lowerQuestion.includes('category') || lowerQuestion.includes('categories') || 
        (lowerQuestion.includes('preferred') && lowerQuestion.includes('categories')) ||
        lowerQuestion.includes('freqshift') || lowerQuestion.includes('pitchmatch') ||
        lowerQuestion.includes('hapticgen') || lowerQuestion.includes('percept')) {
      const analysis = analyzeCategoryPreferences();
      return {
        text: `Category-specific design preferences analysis:`,
        data: {
          type: 'category-preferences',
          analysis: analysis
        }
      };
    }

    // Check for class variation questions
    if (lowerQuestion.includes('classes') || lowerQuestion.includes('vary') || lowerQuestion.includes('across')) {
      const analysis = analyzeClassVariations();
      return {
        text: `Class-specific design preferences analysis:`,
        data: {
          type: 'class-variations',
          analysis: analysis
        }
      };
    }

    // Check for general design preference questions (more general)
    if (lowerQuestion.includes('preferred') || lowerQuestion.includes('consistently') || 
        lowerQuestion.includes('best') || lowerQuestion.includes('top') || 
        lowerQuestion.includes('designs')) {
      const analysis = analyzeDesignPreferences();
      return {
        text: `Based on the analysis of ${summary.totalEntries} ratings:`,
        data: {
          type: 'design-preferences',
          analysis: analysis
        }
      };
    }

    return {
      text: `🤖 I'm here to help you explore vibration design preferences! Here are some things you can ask me about:

🎯 Design Preferences:
- "Which designs are consistently preferred?"
- "What are the best vibration designs?"

📂 Category Analysis:
- "Are there category-specific design preferences?"
- "Which designs work best for different categories?"

🎵 Class Variations:
- "Do preferences vary across classes?"
- "How do designs perform in different classes?"

💡 Quick Insights:
- "Show me the top design"
- "Which design wins most categories?"
- "What's the most consistent design?"

💬 You can also click any of the quick question buttons above for instant analysis!`
    };
  };

  const renderDesignPreferences = (analysis: any) => (
    <div className="analysis-result">
      <div className="result-header">
        <h4>🎯 Most Preferred Design</h4>
        <div className="top-design">
          <span className="design-name">{analysis.topDesign.design}</span>
          <span className="rating">{analysis.topDesign.avgRating.toFixed(2)}/100</span>
        </div>
      </div>
      
      <div className="design-rankings">
        <h4>📊 Design Rankings</h4>
        <div className="ranking-list">
          {analysis.allDesigns.map((design: any, index: number) => (
            <div key={design.design} className={`ranking-item ${index === 0 ? 'top' : ''}`}>
              <span className="rank">#{index + 1}</span>
              <span className="design-name">{design.design}</span>
              <span className="rating">{design.avgRating.toFixed(2)}/100</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="consistency-info">
        <h4>📈 Most Consistent Design</h4>
        <div className="consistency-item">
          <span className="design-name">{analysis.mostConsistent.design}</span>
          <span className="std-dev">Std Dev: {analysis.mostConsistent.stdDev.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const renderCategoryPreferences = (analysis: any) => {
    const categoryWinners = analysis.map((a: any) => a.topDesign.design);
    const winnerCounts = categoryWinners.reduce((acc: Record<string, number>, design: string) => {
      acc[design] = (acc[design] || 0) + 1;
      return acc;
    }, {});
    
    const insightItems = Object.entries(winnerCounts).map(([design, count]) => (
      <div key={design} className="insight-item">
        <span className="design-name">{design}</span>
        <span className="count">preferred in {count as number} categories</span>
      </div>
    ));

    return (
      <div className="analysis-result">
        <div className="category-list">
          <h4>📂 Category-Specific Preferences</h4>
          {analysis.map((cat: any, index: number) => (
            <div key={cat.category} className="category-item">
              <div className="category-header">
                <span className="category-name">{cat.category}</span>
                <span className="preferred-design">{cat.topDesign.design}</span>
              </div>
              <div className="category-rating">
                <span className="rating">{cat.topDesign.avgRating.toFixed(2)}/100</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="insights">
          <h4>💡 Key Insights</h4>
          <div className="insight-list">
            {insightItems}
          </div>
        </div>
      </div>
    );
  };

  const renderClassVariations = (analysis: any) => {
    const classWinners = analysis.classAnalysis.map((a: any) => a.topDesign.design);
    const winnerCounts = classWinners.reduce((acc: Record<string, number>, design: string) => {
      acc[design] = (acc[design] || 0) + 1;
      return acc;
    }, {});
    
    const variationItems = Object.entries(winnerCounts).map(([design, count]) => (
      <div key={design} className="variation-item">
        <span className="design-name">{design}</span>
        <span className="count">preferred in {count as number} classes</span>
      </div>
    ));

    return (
      <div className="analysis-result">
        <div className="class-list">
          <h4>🎵 Class-Specific Preferences</h4>
          {analysis.classAnalysis.map((cls: any) => (
            <div key={cls.class} className="class-item">
              <div className="class-header">
                <span className="class-name">Class {cls.class}</span>
                <span className="preferred-design">{cls.topDesign.design}</span>
              </div>
              <div className="class-rating">
                <span className="rating">{cls.topDesign.avgRating.toFixed(2)}/100</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="variation-insights">
          <h4>📊 Variation Analysis</h4>
          <div className="variation-list">
            {variationItems}
          </div>
        </div>
      </div>
    );
  };

  const renderMessageContent = (message: Message) => {
    if (message.isUser) {
      return <div className="user-message">{message.text}</div>;
    }

    return (
      <div className="bot-message">
        {message.data ? (
          <>
            <div className="message-text">{message.text}</div>
            <div className="message-data">
              {message.data.type === 'design-preferences' && renderDesignPreferences(message.data.analysis)}
              {message.data.type === 'category-preferences' && renderCategoryPreferences(message.data.analysis)}
              {message.data.type === 'class-variations' && renderClassVariations(message.data.analysis)}
            </div>
          </>
        ) : (
          <div className="message-text-only">
            {message.text}
          </div>
        )}
      </div>
    );
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const answer = generateAnswer(inputValue);
      console.log('Generated answer:', answer); // Debug log
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answer.text,
        isUser: false,
        timestamp: new Date(),
        data: answer.data
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="research-chatbot">
      <div className="chatbot-header">
        <h3>🔬 Research Assistant</h3>
        <p>Ask questions about vibration design preferences</p>
      </div>

      <div className="quick-questions">
        <h4>Quick Questions:</h4>
        <div className="question-buttons">
          {predefinedQuestions.map((q, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(q.question)}
              className="quick-question-btn"
            >
              {q.question}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.isUser ? 'user' : 'bot'}`}
          >
            <div className="message-content">
              {renderMessageContent(message)}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message bot">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about vibration design preferences..."
          rows={2}
        />
        <button onClick={handleSendMessage} disabled={!inputValue.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ResearchChatbot; 