# pyrefly: ignore [missing-import]
from langchain_community.document_loaders import PyPDFLoader

data = PyPDFLoader('/Users/kk/AI_Projects/Vachnamrut/document_loder/vachnamrut-english.pdf')
docs = data.load()


print(len(docs))