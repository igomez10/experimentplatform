import { useState, useRef, useEffect } from 'react';
import { useExperiment } from './hooks/useExperiment';
import { listProviders, getProvider } from './services/llm';

function App() {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState('mock');
  const [sampleSize, setSampleSize] = useState(50);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const { runExperiment, isRunning, progress, results, error, reset } = useExperiment();

  const fileInput1 = useRef(null);
  const fileInput2 = useRef(null);

  // Check Ollama availability when provider changes
  useEffect(() => {
    if (provider === 'ollama') {
      checkOllamaStatus();
    }
  }, [provider]);

  const checkOllamaStatus = async () => {
    try {
      const ollamaProvider = getProvider('ollama');
      const available = await ollamaProvider.isAvailable();
      const models = await ollamaProvider.listModels();
      setOllamaStatus({
        available,
        models: models.map(m => m.name),
      });
    } catch {
      setOllamaStatus({ available: false, models: [] });
    }
  };

  const handleImageUpload = (e, setImage) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e, setImage) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRunExperiment = () => {
    if (image1 && image2 && question.trim()) {
      runExperiment(image1, image2, question, provider, {}, sampleSize);
    }
  };

  const handleReset = () => {
    setImage1(null);
    setImage2(null);
    setQuestion('');
    reset();
  };

  const canRun = image1 && image2 && question.trim() && !isRunning;

  return (
    <div className="app">
      <h1>Experiment Platform</h1>
      <p className="subtitle">Compare two images using LLM-based evaluation with statistical analysis</p>

      <div className="images-container">
        <div className="image-box">
          <h3>Image A</h3>
          <div
            className={`upload-area ${image1 ? 'has-image' : ''}`}
            onClick={() => fileInput1.current?.click()}
            onDrop={(e) => handleDrop(e, setImage1)}
            onDragOver={handleDragOver}
          >
            {image1 ? (
              <img src={image1} alt="Image A" />
            ) : (
              <div className="placeholder">
                <span>Click or drag to upload</span>
              </div>
            )}
          </div>
          <input
            ref={fileInput1}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setImage1)}
            hidden
          />
        </div>

        <div className="image-box">
          <h3>Image B</h3>
          <div
            className={`upload-area ${image2 ? 'has-image' : ''}`}
            onClick={() => fileInput2.current?.click()}
            onDrop={(e) => handleDrop(e, setImage2)}
            onDragOver={handleDragOver}
          >
            {image2 ? (
              <img src={image2} alt="Image B" />
            ) : (
              <div className="placeholder">
                <span>Click or drag to upload</span>
              </div>
            )}
          </div>
          <input
            ref={fileInput2}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setImage2)}
            hidden
          />
        </div>
      </div>

      <div className="question-section">
        <label htmlFor="question">Question for LLM:</label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., How much on a scale from 1 to 10 do you like this image?"
          rows={3}
        />
      </div>

      <div className="settings-section">
        <div className="setting">
          <label htmlFor="provider">LLM Provider:</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="mock">Mock (Simulated)</option>
            <option value="ollama">Ollama (Local)</option>
          </select>
        </div>

        <div className="setting">
          <label htmlFor="sampleSize">Sample Size:</label>
          <select
            id="sampleSize"
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
          >
            <option value={10}>10 queries each</option>
            <option value={30}>30 queries each</option>
            <option value={50}>50 queries each</option>
          </select>
        </div>
      </div>

      {provider === 'ollama' && ollamaStatus && (
        <div className={`provider-status ${ollamaStatus.available ? 'available' : 'unavailable'}`}>
          {ollamaStatus.available ? (
            <>
              <span className="status-icon">&#10003;</span>
              Ollama connected - Using llama3.2-vision
            </>
          ) : (
            <>
              <span className="status-icon">&#10007;</span>
              Ollama not available. Make sure it's running: <code>ollama serve</code>
            </>
          )}
        </div>
      )}

      <div className="actions">
        <button
          className="run-button"
          onClick={handleRunExperiment}
          disabled={!canRun}
        >
          {isRunning ? 'Running Experiment...' : 'Run Experiment'}
        </button>
        <button className="reset-button" onClick={handleReset}>
          Reset
        </button>
      </div>

      {isRunning && (
        <div className="progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <span>{progress.current} / {progress.total} queries completed</span>
        </div>
      )}

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {results && (
        <div className="results">
          <h2>Results</h2>

          {results.provider && (
            <div className="provider-info">
              Provider: {results.provider.name}
              {results.provider.model && ` (${results.provider.model})`}
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <h4>Image A</h4>
              <div className="stat-value">{results.image1.mean.toFixed(2)}</div>
              <div className="stat-label">Mean Rating</div>
              <div className="stat-detail">SD: {results.image1.std.toFixed(2)}</div>
            </div>

            <div className="stat-card">
              <h4>Image B</h4>
              <div className="stat-value">{results.image2.mean.toFixed(2)}</div>
              <div className="stat-label">Mean Rating</div>
              <div className="stat-detail">SD: {results.image2.std.toFixed(2)}</div>
            </div>
          </div>

          <div className="statistical-analysis">
            <h3>Statistical Analysis (Welch's t-test, alpha = 0.05)</h3>
            <table>
              <tbody>
                <tr>
                  <td>t-statistic:</td>
                  <td>{results.statistics.tStatistic.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>Degrees of Freedom:</td>
                  <td>{results.statistics.degreesOfFreedom.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>p-value:</td>
                  <td>{results.statistics.pValue.toFixed(6)}</td>
                </tr>
                <tr>
                  <td>Effect Size (Cohen's d):</td>
                  <td>{results.statistics.effectSize.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>

            <div className={`conclusion ${results.statistics.isSignificant ? 'significant' : 'not-significant'}`}>
              {results.statistics.isSignificant ? (
                <>
                  <strong>Statistically Significant Difference</strong>
                  <p>
                    The difference between Image A (M={results.image1.mean.toFixed(2)}) and
                    Image B (M={results.image2.mean.toFixed(2)}) is statistically significant
                    (p = {results.statistics.pValue.toFixed(6)} &lt; 0.05).
                  </p>
                </>
              ) : (
                <>
                  <strong>No Statistically Significant Difference</strong>
                  <p>
                    There is no statistically significant difference between
                    Image A (M={results.image1.mean.toFixed(2)}) and
                    Image B (M={results.image2.mean.toFixed(2)})
                    (p = {results.statistics.pValue.toFixed(6)} &ge; 0.05).
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
