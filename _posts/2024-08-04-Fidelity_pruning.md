---
layout: post 
title: On the feasibility of fidelity- for graph pruning
description: 
tags: Graph_learning, XAI
giscus_comments: true 
date: 2024-08-03
featured: true
categories: Graph_pruning
related_publications: 
toc:
  sidebar: left
# Below is an example of injecting additional post-specific styles.
# If you use this post as a template, delete this _styles block.

---

[Full paper](https://arxiv.org/abs/2406.11504v1), [Workshop site](https://sites.google.com/view/xai2024/home), [Presentation slides](https://drive.google.com/file/d/1wLAkPpL-2UHZcwUcn7dFT6UOjkvYhSTb/view?usp=sharing), [Poster](https://drive.google.com/file/d/1QlNp618vzLtTdMqMuS8IEVQAvUL3msQ5/view?usp=sharing)

This is an blog post on the paper “On the Feasibility of Fidelity- for Graph Pruning”, presented in the IJCAI 2024 Workshop on Explainable Artificial Intelligence (XAI). I hope this post provides a more informal yet interesting discussion around the paper.

### Main post

Why do we need to explain AI models? Personally, the model debugging & social aspect [1] was the most compelling argument during the early days I started to get involved in XAI. Progressing through the field, I eventually learned that a lot of methods have been developed to address this objective of XAI, and quite effectively (although may not be perfect).

Recently, my focus shifted towards a more *eventual* goal of XAI: Wouldn’t it be great if we go full circle and use the information gained from the explanations back to the model for improvement? The idea of using the explanation as a means to improvement is also referenced in [4] in the context of using AI for science:

*“In the sciences, identifying these patterns, i.e., explaining and interpreting what features the AI system uses for predicting, is often more important than the prediction itself, because it unveils information about the biological, chemical or neural mechanisms and may lead to new scientific insights.”*

Although the quote is in the context for pursuing new scientific discoveries, there are already some studies that also push explanations towards model improvement, specifically. One example of this would be [5], where it includes the explanation as a term in the loss function in order to further regularize the model. Another one would be [6], where it uses the explanation to directly control how information flows inside the graph neural network model (GNN).

This work also shares the same objective.

Specifically, we are working on the domain of graph learning, and naturally we are interested in the improvement of *GNN models*. Briefly speaking, GNNs are a type of neural network architecture made to perform on graph data. For each node, the local graph structure is aggregated and processed by the GNN, which typically generates a latent representation fit for some specific task (e.g., node classification).

The **explanation** for this (’target’) node is typically returned as a subset of surrounding nodes or edges that highly contributes to the model’s decisions. You can easily imagine that out of the nearby local edge (or nodes), not all edges are critically used to, let’s say, predict the target node’s class. Specifically, the explanation method takes in the target node, given graph, and the GNN model to be explained and assigns an ‘important score’ to the nearby edges (or nodes). Naturally, if the explanation method is ‘good’, the importance score will accurately reflect the GNN’s point of view when computing the output. This is an important logic that will be used throughout the project.

This logic is also reflected in ‘fidelity$$^{-}$$’, a quantitative measurement to assess the explanation method’s performance. To see whether the explanation method is truly faithful to the GNN model, one can imagine the following experiment: take the target node and its local graph structure, run the explanation to get important scores, delete edges that are deemed ‘unimportant’, and see how much the model’s response have changed without deletion. If the deleted edges were truly unimportant to the target node, we should see small or no changes in the model behavior.

As I mentioned, fidelity$$^{-}$$ is mainly used for assessing explanation methods [7]. But let’s look at it this way: According to the fidelity$$^{-}$$ measure, we can view the explanation methods as some sort of filter that can pick out unimportant edges. Pushing this idea, **how about we just use explanations to find globally (i.e., for all nodes in the graph) unimportant edges**? In other words, **can we use explanations for graph pruning**?

Pruning a graph has been a separate research topic. Typically, one might consider graph pruning in order to achieve better efficiency of GNN models, since GNNs are known to have time & memory complexity being proportional to the number of edges in the input graph [8]. The removal of unnecessary edges will not only result in better efficiency, but perhaps also act as a data denoising process in itself [9]. However, to the best of our knowledge, we are the first to propose using explanation for graph pruning.

To see whether explanations are a good fit for graph pruning, we first need a method on how to do this. For this, we propose FiP (Fidelity-inspired Pruning), which takes explanations for all nodes in the graph and produces a pruned graph with different sparsity levels. The main task that FiP is required to perform is to aggregate a bunch of local edge importance scores to global edge importance score (i.e., going from importance scores for a specific node to a general importance score independent from any specific node). This is fairly straightforward: Imagine we now focus our attention to one specific edge while running explanations for all nodes in the graph. During this process, a number of importance scores will be assigned to that edge when the target node is nearby. After running the explanation is complete, we simply ‘sum’ or ‘average out’ these importance scores to get a single global importance score value. After this process has been done for all edges, we can choose to keep edges with the top $$k$$% global importance scores.

Well, now we know how to convert explanations into pruning graphs, the next question would be how much does explanation methods actually perform in graph pruning? We follow the typical setting where we measure the test performance of the GNN using the pruned graph for different levels of sparsity (5% removed all the way up to 95%, 100% removed). For what explanation method to use, we consider the following methods, which includes GNN-tailored and general explanation methods:

- Attention
- Saliency Attribution (i.e., gradient norm)
- Integrated Gradient
- Guided Backpropagation
- GNNExplainer
- PGExplainer
- FastDnX

And for graph pruning, we also throw in a random baseline (random removal). We show for four datasets (BAShapes, Cora, Citeseer and Pubmed), and consider both sum and averaging during FiP:

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="/assets/img/blog6_1.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  Graph pruning results using various explanation methods.
</div>

There are some interesting points worth mentioning:

- Not all explanation methods are great for graph pruning.
  - Surprisingly, GNN-tailored explanations are generally worse for graph pruning (ex. GNNExplainer).
  - The worse performing methods can even go even below random deletion.
- There are some datasets that pruning is bad overall (ex. looking at the test performance for Pubmed, almost all methods barely perform better than random).

Taken quite aback, we had to check the actual fideltiy$$^{-}$$ scores for each method. After all, the idea of using explanations for graph pruning came from fideltiy$$^{-}$$:

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="/assets/img/blog6_2.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  Fidelity- scores for various explanation methods.
</div>

In summary, the table suggests that fideltiy$$^{-}$$ scores does not necessarily translate to good graph pruning performances: Especially looking at GNNExplainer, it shows the best fideltiy$$^{-}$$ scores for two datasets, despite being one of the poorest in the graph pruning experiment.

Why does this happen? Well, we think that despite the logic from fideltiy$$^{-}$$ into graph pruning itself is okay, the technical details during FiP matters. One of the key characteristics of many ‘general’ explanation method (i.e., attention, saliency, integrated gradient, and guided backpropagation) is that the importance scores are relatively well behaved. In other words, the edge importance scores for these methods typically fall in a range (perhaps [0, 1]) and does not vary much from node to node. However, this may not be the case for GNN-tailored method, which often relies on optimization (GNNExplainer) and allows for importance scores to have high variance.

This suggests that the scale normalization between nodes is a significant matter. However, how to adjust the scale across nodes make the problem quite tricky. For one, let’s say we want to normalize the sum of edge importance scores for each node to 1. This seems okay, but perhaps some nodes have very new local edges or others may have a lot of nearby edges, depending on the given graph structure. Between these two cases, making the sum to 1 for both cases is unfair. We will have to come up with a better solution for this, which I will be working on in the near future.

### References & Notes

[1] Explaining the reason behind a deep neural network classifier might reveal whether the model is performing classification with the right reasons (see also: Clever Hans [2, 3]). Also, providing the reason behind the AI model’s behavior helps establishing a trust relationship between the machine and user [4].

[2] <https://en.wikipedia.org/wiki/Clever_Hans>

[3] Lapuschkin *et al.* Unmasking Clever Hans predictors and assessing what machines really learn. *Nat Commun* 10, 1096 (2019).

[4] Samek & Müller, Towards Explainable Artificial Intelligence. Explainable AI 2019: 5-22

[5] Rieger et al., Interpretations are Useful: Penalizing Explanations to Align Neural Networks with Prior Knowledge, ICML 2020

[6] Giunchiglia et al., Towards Training GNNs using Explanation Directed Message Passing, LoG 2022

[7] Yuan et al., Explainability in Graph Neural Networks: A Taxonomic Survey, TPAMI (2023)

[8] Chiang et al., Cluster-GCN: An Efficient Algorithm for Training Deep and Large Graph Convolutional Networks, KDD 2019

[9] Chen et al., A Unified Lottery Tickets Hypothesis for Graph Neural Networks, ICML 2021