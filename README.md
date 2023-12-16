# Agentcy: Multi-Agent Collaboration — AutoGen x OpenAI Assistants API

<p align="center">
  <img src='./misc/logo1.png' width=888>
</p>

This code demonstrates the power of multi-agent collaboration using the [AutoGen library](https://github.com/microsoft/autogen) and [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview). Instead of relying on a single agent to handle tasks, multiple specialized agents work together, each bringing its expertise to the table.


## 📖 Overview

The code sets up a collaborative environment where multiple agents, each with its unique role and expertise, come together to discuss, plan, and execute tasks. This collaboration ensures that different aspects of a task are handled by the most qualified agent, leading to more efficient and accurate outcomes.

## 🕵🏽 Agents

The agents involved in the collaboration include:

1. **Director**: Conducts research on user pain points, market opportunities, and prevailing market conditions.
2. **Researcher**: Utilizes research and content writing functions to generate content.
3. **Manager**: Drafts strategic briefs for effective brand positioning in the market.

## 🕵🏽 Key Features

**Automated Google Search**: Utilizes the SERPER API to perform targeted Google searches based on user input.
**Web Scraping**: Implements the BeautifulSoup library for scraping web content, combined with the Browserless API for seamless data extraction.
Text Summarization: Employs the langchain library and GPT-3.5 models for generating concise summaries of large text blocks, tailored to specific objectives.
**Interactive Chat Agents**: Integrates autogen and GPT-based agents to create an interactive research experience, allowing users to input their research goals and receive customized outputs.

## ⚙️ Setup & Configuration

1. Ensure required libraries are installed:
```
pip install pyautogen==0.2.0b5
```

2. Set up the OpenAI configuration list by either providing an environment variable `OAI_CONFIG_LIST` or specifying a file path.
```
[
    {
        "model": "gpt-3.5-turbo", #or whatever model you prefer
        "api_key": "INSERT_HERE"
    }
]
```

3. Setup api keys in .env:
```
OPENAI_API_KEY="XXX"
SERPAPI_API_KEY="XXX"
SERPER_API_KEY="XXX"
BROWSERLESS_API_KEY="XXX"
```

4. Launch in CLI:
```
python3 main.py
```

## ⏯️ Conclusion

In the realm of creative agencies, the multi-agent collaboration approach revolutionizes the way projects are handled. By tapping into the distinct expertise of various agency roles, from strategists to media planners, we can guarantee that each facet of a project is managed by those best suited for the task. This methodology not only ensures precision and efficiency but also showcases its versatility, as it can be tailored to suit diverse project requirements, whether it's brand positioning, content creation, or any other creative endeavor. 

## 📈 Roadmap

1. Refine workflow and data pass through to agents
2. Reduce unnecessaery back and forth
3. Save files to local folder
4. Implement other agents, see commented out agents
6. Create and train fine-tuned agents for each domain specific task

## 📝 License 

MIT License. See [LICENSE](https://opensource.org/license/mit/) for more information.