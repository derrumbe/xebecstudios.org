---
title: "It’s Not Fair! Detecting Algorithmic Bias with Open Source Tools"
date: 2022-06-03
subject: Technology
tags: [AI, Ethics]
crossFiled: [Philosophy]
description: "TODO write a one-line description"
legacySlug: "its-not-fair-detecting-algorithmic-bias-with-open-source-tools"
# ~3 min
---

Wondering what to watch on Netflix tonight?

_There’s an algorithm for that._

Wondering what to buy next on Amazon this afternoon?

_There’s an algorithm for that._

Using algorithms and machine learning to predict future state is commonplace these days. In its best forms, it can direct us into new sources of entertainment or products that can improve our lives. As the use of these algorithms cascade across our society, however, their potential significance increases:

Wondering who is likely to commit a crime tomorrow? Wondering who should be next in line for a kidney transplant? There’s an algorithm for that, too.

Over the last decade or so, researchers have discovered inherent biases in many of these algorithms. In 2016, [ProPublica reported racial bias in the recidivism algorithm](https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing)—a risk assessment used to predict whether a defendant is likely to commit a crime in the future. [A more recent study](https://www.pennmedicine.org/news/publications-and-special-projects/penn-medicine-magazine/winter-2021/filtering-bias-out-of-kidney-testing) revealed that the algorithm used to predict renal failure had a similarly undetected bias.

The flaws in these algorithms does not result in poor entertainment choices, however: they impact sentencing terms and decrease the likelihood of receiving essential medial care. As algorithms become ubiquitous, then, our goal must be to find and ameliorate any potential bias within them—in short, to promote the fairness of the algorithm.

This is more easily said than done, of course. Bias can be hidden within the algorithm itself, within the data it is drawn on, or introduced in various other forms. Complicating matters further, not every algorithm—particularly when machine learning is used—is easily explainable. This explainability is essential: how can you decide if a system is biased or not if you don’t know why it is selecting a particular result?

We are therefore presented with two challenges as we use algorithms and machine learning: transparency and fairness. These are formidable tasks, but thankfully there are a set of open-source tools that can help:

**Transparency**

Three main tools seek to make machine learning algorithms explainable or transparent: LIME, SHAP, and Google’s What-If tool.

[LIME](https://github.com/marcotcr/lime) uses “local model approximation” to reduce the problem set to a subset of instances within the data set. It can then attempt to simplify the explanation for that subset of the data.

[SHAP](https://github.com/slundberg/shap%0D%0A) is a method based on a concept of Shapley value in game theory. It does a set of mathematical computations to figure out the contribution of features (as the players) to the outcome of the prediction (or the payout in game theory context).

[Google’s What-If?](https://pair-code.github.io/what-if-tool/%0D%0A) tool is a visualization of the data set and allows the exploration of both data and “what-if” scenarios.

Along with exploring the trained machine model and allowing examination of both data and conclusions that the model has made, it allows for the examination of “counterfactuals”: you can select a point, as we’ve done here in a sample data set, and check to see why a similar point falls under a different classification.

**Fairness**

To seek out bias directly, there are a different set of tools available for use. One of the easiest to use is the [Aequitas Fairness Toolkit.](https://github.com/dssg/aequitas%0D%0A) It can be used for in-depth analysis with an available API, or it can be rapidly utilized via a web-based application.

It results in a report that provides baselines for various groups or populations within the algorithmic model, quantifying whether or not each group is being treated equally and providing metrics such as false positives and negatives.

**RSAC 2022 Session**

If you’re interested in hearing more about these tools, discussing how to use them well, or seeing them demonstrated live, [I’ll be talking about them along with Mo Badawy, Principal Data Scientist at RSAC2022 on June 6th.](https://www.rsaconference.com/usa/agenda/session/Its%20Not%20Fair%20Detecting%20Algorithmic%20Bias%20with%20Open%20Source%20Tools)

Wondering how to eliminate bias from your machine learning algorithm?

_There’s an open-source tool for that._
