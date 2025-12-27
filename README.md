# Snack - Inference Cost Calculator

**Stop overpaying for LLM inference.** Compare costs across providers in seconds.

🔗 **Try it:** [calculator.snackai.dev](https://calculator.snackai.dev)

---

## What is this?

A simple calculator that compares LLM inference costs across major providers:

- **Together AI**
- **Fireworks**
- **Groq**
- **Baseten**
- **Replicate**
- **AWS Bedrock**

Enter your workload (requests/day, tokens, latency needs) and instantly see which provider is cheapest.

## Models Supported

- Llama 3.1 70B & 8B
- DeepSeek R1 & V3
- Mixtral 8x7B
- more to come...

## Why we built this

Teams running high-volume inference often pick a provider and stick with it — even when prices change or better options emerge. We found teams doing manual spreadsheet comparisons every few weeks.

This tool makes it instant.

## About Snack

We're building tools to help AI teams optimize inference costs. This calculator is step one.

📧 **Contact:** hello@snackai.dev

---

## Contributing

Found a pricing error? Provider missing? Open an issue or PR.

Pricing data is in `src/App.jsx` in the `providerData` object.

## License

MIT
