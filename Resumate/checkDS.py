from datasets import load_dataset

ds = load_dataset("datasetmaster/resumes")

print(ds["train"].features)