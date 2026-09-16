# Hadrien Cornier

Austin, Texas, United States | [hadrien.cornier@gmail.com](mailto:hadrien.cornier@gmail.com) | [linkedin.com/in/hadrien-cornier](https://linkedin.com/in/hadrien-cornier)

Engineering manager and hands-on ML/data engineer leading a team of seven data, machine learning, and backend engineers and responsible for backend data infrastructure. Built systems for collection, enrichment, sensor telemetry, evaluation, and production ML across three companies. Works closely with the founder on product, commercial strategy, negotiation, and operations.

## Experience

### Talroo · Austin, TX | Jul 2021–Present

**Engineering Manager** 2025–present · **Senior ML Engineer** 2022–2025 · **ML Engineer** 2021–2022

#### Data platform & team leadership

- Responsible for backend data systems spanning job ingestion and enrichment, analytics, application delivery to employer systems, and pricing information sent to publishers. Own the coordination platform for ETL, training, inference, and production jobs.
- Conducted about 300 software engineer interviews and built the hiring system, including evaluation heuristics.
- Lead seven data, machine learning, and backend engineers while remaining hands-on in architecture, technical review, hiring, and delivery.
- Set direction and identify opportunities, giving engineers autonomy and freedom in how they approach their work. Motivate the team and connect engineers with direct feedback on the features they build.
- Built and scaled job-enrichment pipelines processing about one million jobs per day across BERT and LLM extraction. Added caching, incremental processing, and change-ID imports.
- Built feedback and correction streams, freshness metrics, dashboards, and alerts. The underlying platform handles about 200 million events daily.
- Built automated rollback and recovery for production jobs, restoring healthy versions and escalating unrecoverable failures.

#### Evaluation & production ML

- Built a job-suitability model using human and LLM labels, model training, and balanced evaluation sets. Established reference answers with a small human-labeled gold dataset and expanded evaluation using LLM-as-judge. Built offline evaluation for models extracting requirements, benefits, pay, and schedule.
- Co-built and productionized a hybrid retrieval engine combining learned job–seeker embeddings with keyword and geographic signals. Redesigned the recommender, increasing revenue by approximately $20M.
- Optimized throughput, latency, and cost for ML systems serving roughly 20 million inference requests daily. Used batching, warm-up, monitoring, numerical validation, and TensorRT/Triton serving; ML optimization saved $1M annually.
- Built deep-learning forecasts of delivery volume and its response to price. Integrated forecasts into job-level bidding, pacing, and delivery controls.
- Replaced manual weekly ML releases with scripted training and deployment workflows, staged serving, and A/B-gated promotion. Ran hundreds of experiments across ranking, retrieval, forecasting, bidding, and publisher quality.
- Co-led AI applicant screening and matching through implementation and technical direction. Led the team that delivered explainable qualification checks and editable application questions; built controls for AI-assisted product customization.

#### AI tooling & company workflows

- Rolled out transcription and built an AI knowledge base to preserve conversations as a reusable data asset, designed to become more valuable as models improve.
- Connected sales and customer support directly with engineers through AI summaries of raw transcripts, without intermediaries. Created a fast feedback loop on features so engineers could get customer feedback directly and see the impact of their work.
- Built an internal MCP server connecting agents to analytics dashboards, company data, and operational systems, with documentation and reusable skills. Developed a benchmark based on common engineer queries to evaluate accuracy, coverage, and utility.
- Automated sales recaps and engineering status reports; used n8n to help non-engineers automate business workflows.
- Introduced Perplexity in 2022, Cursor around November 2023, and Claude Code in June 2025. Led the transition from ChatGPT to Claude for internal MCP workflows and trained engineers and data scientists in agentic coding.
- Built campaign-monitoring agents for anomaly investigation and issue routing. Automated publisher responses and reporting, and automatically flagged issues for follow-up.

#### Commercial & operating responsibility

- Negotiated with our largest agency partner, generating an additional $500K in monthly revenue. Negotiated better terms with our ATS-integration provider.
- Helped prepare the technical-commercial case for the agency negotiation and participated in follow-through. Internal reports subsequently recorded doubled partner spend.
- Rebuilt prospect prioritization as a live CRM automation with ranked queues and sales briefs. Connected lead enrichment, follow-ups, and interaction summaries; turned churn analysis into win-back drafts and product feedback.
- Established recurring sales-engineer workshops and gathered feedback from sales, support, and CRM records to guide product changes. Partnered with account leadership on contact priorities and escalation rules; connected engineering updates to refreshed marketing materials.
- Took over a declining publisher network in August 2025. Added monitoring, personalization, notifications, and self-service controls; translated partner-targeting needs into technical requirements. Monthly volume returned to year-over-year growth by mid-2026.
- Responsible for the publisher network and allocating approximately $1M in monthly spend across publishers.
- Responsible for $5M a year in cloud and software contracts. Own all company software contracts, including renewals, spending forecasts, and negotiations to secure better terms.

Mentored by founder Bruce Ge for roughly three hours weekly over multiple years in operations, product, and engineering.

### Augustus Intelligence · New York City | Apr 2020–Jul 2021

**ML Engineer**

- Built backend and data pipelines for distributed retail camera sensors, collecting telemetry and camera-derived time series for heat maps, demographic estimates, and operational analytics.
- Built the control plane for remote software updates, device monitoring, and automated processing. Contributed to computer-vision research for industrial anomaly detection.

### Revelio Labs · New York City | Jun 2019–Aug 2019

**ML Intern**

- Refactored web-scraping and enrichment pipelines, improving responsiveness and enabling SQL queries.
- Owned two production models for company payroll estimation and resume valuation.

### Gendarmerie Nationale · Ajaccio, Corsica | Sep 2015–Apr 2016

**Officer Cadet**

## Education

**Columbia University** · New York City | 2018–2019
MS, Data Science, Statistics and Machine Learning

**École Polytechnique** · Palaiseau, France | 2015–2019
MS, Computer Science and Applied Mathematics

**Harvard Law School Executive Education** · Cambridge, MA | Mar 2026
Negotiation and Leadership

**Stanford University** · Stanford, CA | Jan 2027 (Upcoming)
Accounting and Finance for the Non-Financial Executive

## Skills

Python · SQL · Spark · Vespa · Triton · TensorRT · Data Pipelines · Workflow Orchestration · Model Evaluation · ML Serving · A/B Testing · MCP · n8n · Agentic Coding · Engineering Management · Negotiation · Sales Operations
