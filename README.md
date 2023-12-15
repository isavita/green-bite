# Green Bite

Green Bite is a Svelte application designed to analyze food images and calculate their carbon footprint. Utilizing OpenAI's powerful models, Green Bite provides an estimation of the CO2e (Carbon Dioxide Equivalent) emissions associated with the ingredients of meals.

## Features

- Upload and analyze food images
- Display a list of ingredients with their associated weights
- Calculate the CO2e of the ingredients in a meal

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js installed on your system
- An OpenAI API key

## Installation

To install Green Bite, follow these steps:

1. Clone the repository:
```bash
git clone https://github.com/isavita/green-bite.git
cd green-bite
```
2. Install the dependencies:
```bash
npm install
```
3. Set up your environment variables:
Create a .env file at the root of the project and add your OPENAI_API_KEY and ASSISTANT_ID:
```text
OPENAI_API_KEY=your_openai_api_key_here
ASSISTANT_ID=your_assistant_id_here
```

## Usage

To run Green Bite, execute the following command:
```bash
npm run dev
```
Navigate to http://localhost:8080 in your web browser to view the application.