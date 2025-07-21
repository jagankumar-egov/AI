import { useState } from "react";
import axios from "axios";
import ReactJson from "react-json-view";

export default function App() {
  const [input, setInput] = useState("");
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  const generateConfig = async () => {
    try {
      const res = await axios.post("http://localhost:5000/generate-config", { prompt: input });
      setConfig(res.data.config);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Natural Language to Config Generator</h1>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={5}
        placeholder="Describe your service..."
        className="border p-2 w-full mb-4"
      />
      <button onClick={generateConfig} className="bg-blue-600 text-white px-4 py-2 rounded">
        Generate Config
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {config && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Generated Config</h2>
          <ReactJson src={config} name={false} collapsed={false} displayDataTypes={false} />
        </div>
      )}
    </div>
  );
}
