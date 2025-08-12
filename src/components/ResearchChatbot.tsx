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

  // Debug data availability
  console.log('🔍 ResearchChatbot data:', {
    ratingsCount: ratings?.length,
    summary: summary,
    hasRatings: !!ratings,
    hasSummary: !!summary
  });

  // Add welcome message on component mount
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: `👋 Hi there! I'm your research assistant for vibration design analysis. I can help you explore how different vibration designs perform across various sound categories and classes.

I have access to data from ${summary.totalEntries} ratings across ${summary.uniqueAudioFiles} audio files, and I can analyze preferences for 4 different vibration designs: freqshift, hapticgen, percept, and pitchmatch.

What would you like to know about? You can ask me about design preferences, category analysis, or class variations!`,
      isUser: false,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    
    // Test the question matching logic
    console.log('🧪 Testing question matching...');
    const testQuestions = [
      "Which vibration design is most preferred overall?",
      "Which vibration designs are consistently preferred?",
      "Are there category-specific design preferences?",
      "Do preferences vary significantly across classes?",
      "Which design works best for human speech?",
      "What's the most consistent vibration design?"
    ];
    
    testQuestions.forEach((question, index) => {
      console.log(`🧪 Test ${index + 1}: "${question}"`);
      const answer = generateAnswer(question);
      console.log(`🧪 Answer ${index + 1}:`, answer);
    });
  }, [summary]);

  // Predefined questions and answers
  const predefinedQuestions = [
    {
      question: "Which vibration designs are consistently preferred?",
      keywords: ["consistently", "preferred", "reliable", "stable"]
    },
    {
      question: "Are there category-specific design preferences?",
      keywords: ["category", "specific", "preferences", "categories"]
    },
    {
      question: "Do preferences vary significantly across classes?",
      keywords: ["classes", "vary", "significantly", "across"]
    },
    {
      question: "Which design works best for human speech?",
      keywords: ["human speech", "speech", "best", "design"]
    },
    {
      question: "What's the most consistent vibration design?",
      keywords: ["consistent", "reliable", "stable", "design"]
    },
    {
      question: "Which vibration design is most preferred overall?",
      keywords: ["preferred", "overall", "best", "top", "designs"]
    },
    {
      question: "Which design performs best across all categories?",
      keywords: ["performs", "best", "across", "categories"]
    },
    {
      question: "Are there significant differences between vibration designs?",
      keywords: ["significant", "differences", "between", "designs"]
    },
    {
      question: "Which design is most reliable for different sound types?",
      keywords: ["reliable", "different", "sound", "types"]
    },
    {
      question: "How do vibration preferences differ by category?",
      keywords: ["preferences", "differ", "category", "categories"]
    }
  ];

  // Analyze data for answers
  const analyzeDesignPreferences = () => {
    console.log('📊 Analyzing design preferences...');
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

    const result = {
      topDesign: sortedByRating[0],
      mostConsistent: mostConsistent[0],
      allDesigns: sortedByRating
    };
    
    console.log('📊 Design preferences result:', result);
    return result;
  };

  const analyzeCategoryPreferences = () => {
    console.log('📊 Analyzing category preferences...');
    const categories = [...new Set(ratings.map(r => r.category))];
    console.log('📊 Categories found:', categories);
    
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

    console.log('📊 Category preferences result:', categoryAnalysis);
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
    console.log('🔍 Analyzing question:', question);
    console.log('🔍 Lower question:', lowerQuestion);
    
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

    // Check for consistently preferred questions (MOST SPECIFIC - check first)
    if (lowerQuestion.includes('consistently preferred') || 
        (lowerQuestion.includes('consistently') && lowerQuestion.includes('preferred'))) {
      console.log('🎯 Matched: Consistently preferred question');
      const analysis = analyzeDesignPreferences();
      
      // Find designs with low standard deviation (high consistency)
      const consistentDesigns = analysis.allDesigns
        .filter(design => design.stdDev < 15) // Low variation threshold
        .sort((a, b) => a.stdDev - b.stdDev);
      
      const consistencyText = consistentDesigns.length > 0 
        ? `The most consistently preferred designs are: ${consistentDesigns.slice(0, 2).map(d => `${d.design} (std dev: ${d.stdDev.toFixed(2)})`).join(', ')}`
        : `All designs show some variation, but ${analysis.mostConsistent.design} has the lowest standard deviation (${analysis.mostConsistent.stdDev.toFixed(2)}).`;
      
      return {
        text: `📊 **Consistency Analysis** based on ${summary.totalEntries} ratings:

${consistencyText}

The analysis considers both average ratings and standard deviation to identify which designs are most consistently preferred across different audio samples.`,
        data: {
          type: 'design-preferences',
          analysis: analysis
        }
      };
    }

    // Check for category-specific preferences questions (SPECIFIC)
    if (lowerQuestion.includes('category-specific') || 
        (lowerQuestion.includes('category') && lowerQuestion.includes('specific'))) {
      console.log('🎯 Matched: Category-specific preferences question');
      const analysis = analyzeCategoryPreferences();
      return {
        text: `Category-specific design preferences analysis:`,
        data: {
          type: 'category-preferences',
          analysis: analysis
        }
      };
    }

    // Check for class variation questions (SPECIFIC)
    if (lowerQuestion.includes('vary significantly') || 
        (lowerQuestion.includes('vary') && lowerQuestion.includes('significantly')) ||
        lowerQuestion.includes('across classes')) {
      console.log('🎯 Matched: Class variation question');
      const analysis = analyzeClassVariations();
      return {
        text: `Analysis of how preferences vary across different classes:`,
        data: {
          type: 'class-variations',
          analysis: analysis
        }
      };
    }

    // Check for human speech specific questions (SPECIFIC)
    if (lowerQuestion.includes('human speech') || lowerQuestion.includes('speech')) {
      console.log('🎯 Matched: Human speech question');
      const analysis = analyzeCategoryPreferences();
      const speechAnalysis = analysis.find(a => a.category === 'Human Speech');
      if (speechAnalysis) {
        return {
          text: `For Human Speech (${speechAnalysis.allDesigns.length} designs analyzed):`,
          data: {
            type: 'category-preferences',
            analysis: [speechAnalysis]
          }
        };
      }
    }

    // Check for consistency questions (SPECIFIC)
    if (lowerQuestion.includes('consistent') || lowerQuestion.includes('reliable') || lowerQuestion.includes('stable')) {
      console.log('🎯 Matched: Consistency question');
      const analysis = analyzeDesignPreferences();
      return {
        text: `Consistency analysis based on ${summary.totalEntries} ratings:`,
        data: {
          type: 'design-preferences',
          analysis: analysis
        }
      };
    }

    // Check for general class variation questions (SPECIFIC)
    if (lowerQuestion.includes('classes') || lowerQuestion.includes('vary') || lowerQuestion.includes('across')) {
      console.log('🎯 Matched: General class variation question');
      const analysis = analyzeClassVariations();
      return {
        text: `Class-specific design preferences analysis:`,
        data: {
          type: 'class-variations',
          analysis: analysis
        }
      };
    }
    
    // Check for category-specific questions (SPECIFIC)
    if (lowerQuestion.includes('category') || lowerQuestion.includes('categories') || 
        (lowerQuestion.includes('preferred') && lowerQuestion.includes('categories'))) {
      console.log('🎯 Matched: Category question');
      const analysis = analyzeCategoryPreferences();
      return {
        text: `Category-specific design preferences analysis:`,
        data: {
          type: 'category-preferences',
          analysis: analysis
        }
      };
    }

    // Check for "most preferred" questions (SPECIFIC)
    if (lowerQuestion.includes('most preferred')) {
      console.log('🎯 Matched: Most preferred question');
      const analysis = analyzeDesignPreferences();
      return {
        text: `Most preferred vibration design analysis based on ${summary.totalEntries} ratings:`,
        data: {
          type: 'design-preferences',
          analysis: analysis
        }
      };
    }

    // Check for "best" questions (SPECIFIC)
    if (lowerQuestion.includes('best') && lowerQuestion.includes('design')) {
      console.log('🎯 Matched: Best design question');
      const analysis = analyzeDesignPreferences();
      return {
        text: `Best vibration design analysis based on ${summary.totalEntries} ratings:`,
        data: {
          type: 'design-preferences',
          analysis: analysis
        }
      };
    }

    // Check for "preferred overall" questions (SPECIFIC)
    if (lowerQuestion.includes('preferred overall') || 
        (lowerQuestion.includes('preferred') && lowerQuestion.includes('overall'))) {
      console.log('🎯 Matched: Preferred overall question');
      const analysis = analyzeDesignPreferences();
      return {
        text: `Overall design preference analysis based on ${summary.totalEntries} ratings:`,
        data: {
          type: 'design-preferences',
          analysis: analysis
        }
      };
    }

    // Check for general design preference questions (MOST GENERAL - check last)
    if (lowerQuestion.includes('preferred') || lowerQuestion.includes('consistently') || 
        lowerQuestion.includes('best') || lowerQuestion.includes('top') || 
        lowerQuestion.includes('designs')) {
      console.log('🎯 Matched: General preference question');
      const analysis = analyzeDesignPreferences();
      return {
        text: `Based on the analysis of ${summary.totalEntries} ratings:`,
        data: {
          type: 'design-preferences',
          analysis: analysis
        }
      };
    }

    console.log('🎯 Matched: No specific condition - showing help');
    return {
      text: `🤖 I'm here to help you explore vibration design preferences! Here are some things you can ask me about:

🎯 **Key Research Questions:**
- "Which vibration designs are consistently preferred?"
- "Are there category-specific design preferences?"
- "Do preferences vary significantly across classes?"

📊 **Design Analysis:**
- "Which vibration design is most preferred overall?"
- "What's the most consistent vibration design?"
- "Which design performs best across all categories?"

📂 **Category Analysis:**
- "Show me category-specific design preferences"
- "Which design works best for human speech?"
- "How do vibration preferences differ by category?"

🎵 **Class Variations:**
- "Do preferences vary across classes?"
- "How do designs perform in different classes?"
- "Are there significant differences between vibration designs?"

💡 **Quick Insights:**
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
        <h4>📊 Design Rankings (by Average Rating)</h4>
        <div className="ranking-list">
          {analysis.allDesigns.map((design: any, index: number) => (
            <div key={design.design} className={`ranking-item ${index === 0 ? 'top' : ''}`}>
              <span className="rank">#{index + 1}</span>
              <span className="design-name">{design.design}</span>
              <span className="rating">{design.avgRating.toFixed(2)}/100</span>
              <span className="std-dev">±{design.stdDev.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="consistency-info">
        <h4>📈 Consistency Analysis</h4>
        <div className="consistency-item">
          <span className="design-name">{analysis.mostConsistent.design}</span>
          <span className="std-dev">Lowest Std Dev: {analysis.mostConsistent.stdDev.toFixed(2)}</span>
        </div>
        <div className="consistency-explanation">
          <p>💡 <strong>Consistency</strong> measures how stable the ratings are across different audio samples. Lower standard deviation = more consistent preferences.</p>
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
    console.log('🚀 Quick question clicked:', question);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Show typing indicator
    setIsTyping(true);
    
    // Generate and add bot response after delay
    setTimeout(() => {
      const answer = generateAnswer(question);
      console.log('🤖 Generated answer:', answer);
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

  return (
    <div className="research-chatbot">
      <div className="chatbot-header">
        <h3>🔬 Research Assistant</h3>
        <p>Ask questions about vibration design preferences</p>
      </div>

      <div className="quick-questions">
        <h4>Quick Questions:</h4>
        <div className="question-buttons">
          {predefinedQuestions.slice(0, 5).map((q, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(q.question)}
              className="quick-question-btn"
            >
              {q.question}
            </button>
          ))}
        </div>
        {predefinedQuestions.length > 5 && (
          <div className="more-questions">
            <p>💡 Type your own question or ask about specific categories, classes, or design comparisons!</p>
          </div>
        )}
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