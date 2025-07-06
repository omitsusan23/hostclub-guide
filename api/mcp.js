export default function handler(req, res) {
  if (req.method === 'POST' || req.method === 'GET') {
    // MCPのテスト用ツール
    res.status(200).json({
      tools: [
        {
          name: "roll_dice",
          description: "Rolls an N-sided die",
          parameters: { sides: "number" }
        }
      ],
      run: (params) => {
        const sides = Number(params.sides) || 6;
        const value = 1 + Math.floor(Math.random() * sides);
        return { result: `🎲 You rolled a ${value}!` };
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
} 