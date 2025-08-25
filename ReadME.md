A full-stack simple note taking application with RAG (Retrieval-Augmented Generation) with MongoDB Vector Search, Hugging Face, Groq, and LangChain.

I have developed the front-end with Typescript ReactJS 19 and used Vite build tool. The backend consists of Node JS and set of libraries (express and mongoose), and MongoDB Atlas for database.

## Authentication

In authenticating users, session-based authentication is used. Sessions are stored in MongoDB using *connect-mongo* library. Passport JS library and express-session is used to make everything possible.

**References:**
*Express-session*
https://github.com/expressjs/session#readme

*Passport JS*
https://www.passportjs.org/

*Connect-mongo*
https://www.npmjs.com/package/connect-mongo
## Retrieval-Augmented Generation

#### Vector Search

First, I setup the vector search in MongoDB. Fortunately it is available in free clusters to experiment with. In applying embeddings to the text in notes, I used Hugging Face Class in LangChain library. I used the model `BAAI/bge-small-en-v1.5` to generate 384 embeddings. I can use other models that generate larger Array of embeddings, but it is not that important now.

*server\utilities\embeddings.util.js*
```javascript

const {
  HuggingFaceInferenceEmbeddings,
} = require("@langchain/community/embeddings/hf");
require("dotenv").config();

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: "BAAI/bge-small-en-v1.5",
});

module.exports = embeddings;

```

I created Chunks collection to store the chunks of texts and their embeddings. Texts are chunked using `RecursiveCharacterTextSplitter` class from *LangChain textsplitters* library. Chunking is important to improve computational processing. It will allow the RAG to retrieve significant or important pieces of texts without seeing or analyzing the entire note (if it is too long). RAG without chunking is like finding information in a book without chapters, sections, etc. It is not that important to the application since it is only a simple note taking app, but I think it is a good practice and a good concept to apply. 

This is my splitter function:
*server\utilities\textSplitter.util.js*

```javascript
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

module.exports = splitter;
```

The chunk size is set to 1000 characters. You can make it smaller like 50 or 100 to see how it works. Chunk overlap allow us to mitigate information loss. It just create an overlap between chunks by 200 characters (a chunk has 200 character similarity to a consequent chunk). 

The whole chunk generator function 

*server\utilities\chunkGenerator.util.js*
```javascript

const Chunk = require("../models/chunks.model");
const splitter = require("./textSplitter.util");
const embeddings = require("./embeddings.util");

const chunkGenerator = async (content, noteId, userId, notebookId) => {
  try {
    const chunks = await splitter.splitText(content);
    
    await Promise.all(
      chunks.map(async (chunk) => {
        const embeddingVector = await embeddings.embedQuery(chunk);
        const newChunk = new Chunk({
          noteId: noteId,
          userId: userId,
          text: chunk,
          notebookId: notebookId ? notebookId : null,
          embedding: embeddingVector,
        });
        
        await newChunk.save();
      })
    );
    
    return { message: "Chunks generated", success: true };
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = chunkGenerator;
```

It directly save the Chunks into database. I go through each chunk in chunks array and save them to database. I think insertMany can also be used here to save all chunks at once to let the database handle this linear process to improve performance in the server. Since in my case, I add other details like noteId, userId, and notebookId, I map the chunks and save them one by one to database. 

**References**

*How to Recursively Split Text by Characters*
https://python.langchain.com/docs/how_to/recursive_text_splitter/
*Mongoose Insert Many*
https://mongoosejs.com/docs/api/model.html#Model.insertMany()

### Generating Answers

The most exciting part is to actually see our RAG to generate answers from our query. Before that, we need to use our `chunkGenerator` first when notes are created.

This is the controller for creating note:

*server\controllers\notes.controller.js*
```javascript

const createNote = async (req, res) => {

  try {
    const { title, content, type, items, notebookId } = req.body;
    const newNote = new Note({
      userId: req.user.id,
      title,
      content,
      type,
      items,
      notebookId: notebookId ? notebookId : null,
    });
    
    const note = await newNote.save();
    
    await chunkGenerator(content, note._id, req.user.id, notebookId);
    
    res.status(200).json({ data: note, message: "Note created successfully" });
  } catch (error) {
    res.status(400).json({ message: "Something went wrong" });
  }

};
```

To generate answers I used Groq class in LangChain library. I used `deepseek-r1-distill-llama-70b`model. I just preferred `deepseek`. But any LLM will do the job here. 

```javascript

const { ChatGroq } = require("@langchain/groq");
require("dotenv").config();

const groqLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "deepseek-r1-distill-llama-70b",
});

module.exports = groqLLM;
```

We need to access first the chunks. I created a function for this that let the RAG get chunks to be processed.

```javascript
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const embeddings = require("./embeddings.util");
const Note = require("../models/notes.model");
const Chunk = require("../models/chunks.model");

const getVectorStore = async () => {
  const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection: Chunk.collection,
    indexName: "notesChunks",
    textKey: "text",
    embeddingKey: "embedding",
  });
  
  return vectorStore;
};

module.exports = getVectorStore;
```

`MongoDBAtlasVectorSearch` is the class used from LangChain library. It accepts two parameters. The embeddings (*server\utilities\embeddings.util.js*) and the vector search index properties. This should be the same with the *index overview* in the *vector search index* at your MongoDB Atlas cluster.

```javascript
...
const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection: Chunk.collection,
    indexName: "notesChunks",
    textKey: "text",
    embeddingKey: "embedding",
  });
...
```

With that, chunks together with their embeddings can now be retrieved.

This is the actual `query` controller:

```javascript
const getVectorStore = require("../utilities/vectorStore.util");
const groqLLM = require("../utilities/groqllm.util");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnablePassthrough } = require("@langchain/core/runnables");
const logger = require("../utilities/logger.util");
const { ObjectId } = require("mongodb");
const Chat = require("../models/chats.model");

const query = async (req, res) => {
  const { query } = req.body;
  const userId = ObjectId.createFromHexString(req.user.id);
  
  try {
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever({
      filter: { userId: userId, deletedAt: null },
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an AI assistant for answering questions based on the provided context from my personal notes. Answer the question thruthfully and concisely based *only* on the context provided. If the answer is not in the context, state that you don't have enough information. Do not make up answers. Please add structure the notes accordingly, and highlight important terms. Context: {context}`,
      ],
      ["human", "{question}"],
    ]);
    
    const chain = RunnablePassthrough.assign({
      context: async (input) => {
        const relevantDocs = await retriever.invoke(input.question);
        return relevantDocs.map((doc) => doc.pageContent).join("\n");
      },
      question: new RunnablePassthrough(),
    })
      .pipe(prompt)
      .pipe(groqLLM)
      .pipe(new StringOutputParser());

    const response = await chain.invoke({ question: query });

    const newChat = new Chat({
      userId: userId,
      query: query,
      answer: response,
    });

    const savedChat = await newChat.save();

    res.json({ answer: response, data: savedChat });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: "Something went wrong" });
  }
};

module.exports = { query };
```

These are the important points in our function:

We converted the userId back into ObjectID from being a string:  `const userId = ObjectId.createFromHexString(req.user.id);` Through this we can be understood by MongoDB to filter notes by userId.

Like other codes, we handle our errors inside `try and catch`. Inside the try block, `vectorStore` is initialized. Using this, note chunks are retrieved using the `asRetriever` function: 

```javascript
...
const retriever = vectorStore.asRetriever({
      filter: { userId: userId, deletedAt: null },
    });
...
```
`deletedAt` is set to null because I have implemented soft-delete feature in which notes are not deleted completely. I just add date to them once they are deleted and remove them if the user restores the note. When notes are deleted, chunks are also deleted and so `deletedAt` field is set to actual date. So here, I need to retrieve chunks that not yet deleted to avoid retrieving already deleted chunks.

We give instruction to the LLM how it will answer queries. We commanded it to answer only from the provided context which are the chunks. From messages we create our template with `ChatPromptTemplate.fromMessages()`. In the second array, we add the question from the actual user `["human", "{question}"]`. 
```javascript
const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an AI assistant for answering questions based on the provided context from my personal notes. Answer the question thruthfully and concisely based *only* on the context provided. If the answer is not in the context, state that you don't have enough information. Do not make up answers. Please add structure the notes accordingly, and highlight important terms. Context: {context}`,
      ],
      ["human", "{question}"],
    ]);
```


We run the things above in a pipeline `RunnablePassthrough`. The `StringOutputParser` parses the LLM output
```javascript
const chain = RunnablePassthrough.assign({
      context: async (input) => {
        const relevantDocs = await retriever.invoke(input.question);
        return relevantDocs.map((doc) => doc.pageContent).join("\n");
      },
      question: new RunnablePassthrough(),
    })
      .pipe(prompt)
      .pipe(groqLLM)
      .pipe(new StringOutputParser());
```

We just need to invoke `RunnablePassthrough` and pass the user's query.
```javascript

const response = await chain.invoke({ question: query });

```

And then we save our chat in the database.

```javascript
const newChat = new Chat({
      userId: userId,
      query: query,
      answer: response,
    });

    const savedChat = await newChat.save();
```

**References**

*RunnablePassthrough*
https://python.langchain.com/api_reference/core/runnables/langchain_core.runnables.passthrough.RunnablePassthrough.html

*StringOutputParser*
https://python.langchain.com/api_reference/core/output_parsers/langchain_core.output_parsers.string.StrOutputParser.html


That's just how everything works.
### Thank you!
