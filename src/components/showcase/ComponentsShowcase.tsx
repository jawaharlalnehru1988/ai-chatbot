'use client';

export default function ComponentsShowcase() {
  const components = [
    {
      id: 'chat',
      name: 'Chat Assistant',
      icon: '💬',
      description: 'AI-powered conversational assistant with streaming responses',
      features: ['Real-time streaming', 'Code syntax highlighting', 'Message history', 'Dark/Light themes'],
      status: 'active',
      color: 'blue'
    },
    {
      id: 'code-gen',
      name: 'Code Generator',
      icon: '⚡',
      description: 'Generate code snippets in various programming languages',
      features: ['Multi-language support', 'Code templates', 'Best practices', 'Error handling'],
      status: 'coming-soon',
      color: 'green'
    },
    {
      id: 'translator',
      name: 'Language Translator',
      icon: '🌐',
      description: 'Translate text between multiple languages instantly',
      features: ['100+ languages', 'Context awareness', 'Bulk translation', 'Language detection'],
      status: 'coming-soon',
      color: 'purple'
    },
    {
      id: 'summarizer',
      name: 'Text Summarizer',
      icon: '📄',
      description: 'Summarize long documents and articles efficiently',
      features: ['Key points extraction', 'Customizable length', 'Multiple formats', 'Source citations'],
      status: 'coming-soon',
      color: 'orange'
    },
    {
      id: 'image-gen',
      name: 'Image Generator',
      icon: '🎨',
      description: 'Create stunning images from text descriptions',
      features: ['DALL-E integration', 'Style options', 'High resolution', 'Batch generation'],
      status: 'planned',
      color: 'pink'
    },
    {
      id: 'data-analyzer',
      name: 'Data Analyzer',
      icon: '📊',
      description: 'Analyze and visualize data with AI insights',
      features: ['Chart generation', 'Statistical analysis', 'Pattern recognition', 'Export options'],
      status: 'planned',
      color: 'indigo'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">Active</span>;
      case 'coming-soon':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full">Coming Soon</span>;
      case 'planned':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded-full">Planned</span>;
      default:
        return null;
    }
  };

  const getColorClasses = (color: string, status: string) => {
    if (status !== 'active') {
      return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
    }
    
    switch (color) {
      case 'blue':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30';
      case 'green':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30';
      case 'purple':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30';
      case 'orange':
        return 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30';
      case 'pink':
        return 'border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30';
      case 'indigo':
        return 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7v4m-7 7v4m-7-4l14-7"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Components</h1>
              <p className="text-gray-600 dark:text-gray-400">Powerful AI tools and features at your fingertips</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">1</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">3</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Coming Soon</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">2</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Planned</div>
            </div>
          </div>
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {components.map((component) => (
            <div
              key={component.id}
              className={`border-2 rounded-xl p-6 transition-all duration-200 ${getColorClasses(component.color, component.status)} ${
                component.status === 'active' ? 'cursor-pointer transform hover:scale-105' : 'cursor-not-allowed opacity-75'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{component.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {component.name}
                    </h3>
                    {getStatusBadge(component.status)}
                  </div>
                </div>
                {component.status === 'active' && (
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {component.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Key Features:</h4>
                <div className="grid grid-cols-1 gap-1">
                  {component.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              {component.status === 'active' && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                    Open {component.name}
                  </button>
                </div>
              )}
              
              {component.status === 'coming-soon' && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button disabled className="w-full bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed font-medium">
                    Coming Soon
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">🚀 More Components Coming Soon!</h3>
            <p className="text-blue-100">
              We&apos;re constantly working on new AI-powered tools to enhance your productivity. 
              Stay tuned for exciting updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}