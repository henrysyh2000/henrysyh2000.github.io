/* Chart data for the published Analogy Diversity notebook entries (01 and 02).
   Real values, published with the author's approval of 2026-11-11. No parameter settings,
   run configurations or raw examples. Every label carries zh and en; the renderer picks by
   <html lang>. Data for entries that are not published yet is kept out of this file. */
(function () {
  'use strict';
  window.NotebookChartData = {
    "step-amplitude": {
      "type": "bars",
      "title": {
        "zh": "写类比时，轨迹的步长更大",
        "en": "Trajectory steps are larger when writing an analogy"
      },
      "sub": {
        "zh": "40 条故事。每条故事的类比首句和直白复述配成一对。",
        "en": "Forty stories. In each, the first analogy sentence is paired with a literal restatement."
      },
      "views": [
        {
          "label": {
            "zh": "平均步长",
            "en": "Mean step"
          },
          "panels": [
            {
              "axis": {
                "min": 0,
                "max": 16,
                "ticks": [
                  0,
                  4,
                  8,
                  12,
                  16
                ],
                "decimals": 1
              },
              "rows": [
                {
                  "label": {
                    "zh": "类比首句",
                    "en": "First analogy sentence"
                  },
                  "values": [
                    14.385
                  ]
                },
                {
                  "label": {
                    "zh": "直白复述",
                    "en": "Literal restatement"
                  },
                  "values": [
                    13.2075
                  ],
                  "tone": "base"
                }
              ]
            }
          ],
          "note": {
            "zh": "类比高出约 9%。步长不是质量分，也不是多样性分。",
            "en": "The analogy is about 9% higher. Step size is neither a quality score nor a diversity score."
          }
        },
        {
          "label": {
            "zh": "逐条故事",
            "en": "Story by story"
          },
          "panels": [
            {
              "axis": {
                "min": 0,
                "max": 40,
                "ticks": [
                  0,
                  10,
                  20,
                  30,
                  40
                ],
                "decimals": 0
              },
              "rows": [
                {
                  "label": {
                    "zh": "类比的步长更大",
                    "en": "Analogy step is larger"
                  },
                  "values": [
                    39
                  ]
                },
                {
                  "label": {
                    "zh": "直白复述的步长更大",
                    "en": "Literal step is larger"
                  },
                  "values": [
                    1
                  ],
                  "tone": "base"
                }
              ]
            }
          ],
          "note": {
            "zh": "40 条故事里 39 条是同一个方向。这是观察，没有动模型。",
            "en": "Thirty-nine of forty stories point the same way. This is an observation; the model was not intervened on."
          }
        }
      ]
    },
    "onset-correlation": {
      "type": "bars",
      "title": {
        "zh": "句首距离与词面新颖性的相关",
        "en": "Onset distance and lexical novelty"
      },
      "sub": {
        "zh": "Spearman ρ。每条横线是四种类比条件之间的最小值到最大值，不是置信区间。",
        "en": "Spearman ρ. Each line spans the minimum to the maximum across four analogy conditions; it is not a confidence interval."
      },
      "views": [
        {
          "label": {
            "zh": "汇总计算",
            "en": "Pooled"
          },
          "panels": [
            {
              "mark": "range",
              "axis": {
                "min": 0,
                "max": 0.6,
                "ticks": [
                  0,
                  0.2,
                  0.4,
                  0.6
                ],
                "decimals": 2
              },
              "refs": [
                {
                  "value": 0.2,
                  "label": {
                    "zh": "登记阈值 0.20",
                    "en": "Registered threshold 0.20"
                  }
                }
              ],
              "rows": [
                {
                  "label": {
                    "zh": "数据集 A",
                    "en": "Dataset A"
                  },
                  "range": [
                    0.3604,
                    0.4895
                  ]
                },
                {
                  "label": {
                    "zh": "数据集 B",
                    "en": "Dataset B"
                  },
                  "range": [
                    0.3068,
                    0.4157
                  ]
                },
                {
                  "label": {
                    "zh": "数据集 C",
                    "en": "Dataset C"
                  },
                  "range": [
                    0.392,
                    0.4311
                  ]
                }
              ]
            }
          ],
          "note": {
            "zh": "十二个组合全部高于阈值。这是相关，不是因果：越往后生成，两个量都可能只是跟着轮次一起变。",
            "en": "All twelve dataset-by-condition cells clear the threshold. This is a correlation, not a causal result: both quantities may simply move with the generation round."
          }
        },
        {
          "label": {
            "zh": "按故事计算后平均",
            "en": "Per story, then averaged"
          },
          "panels": [
            {
              "mark": "range",
              "axis": {
                "min": 0,
                "max": 0.6,
                "ticks": [
                  0,
                  0.2,
                  0.4,
                  0.6
                ],
                "decimals": 2
              },
              "refs": [
                {
                  "value": 0.15,
                  "label": {
                    "zh": "登记阈值 0.15",
                    "en": "Registered threshold 0.15"
                  }
                }
              ],
              "rows": [
                {
                  "label": {
                    "zh": "数据集 A",
                    "en": "Dataset A"
                  },
                  "range": [
                    0.4332,
                    0.552
                  ]
                },
                {
                  "label": {
                    "zh": "数据集 B",
                    "en": "Dataset B"
                  },
                  "range": [
                    0.3668,
                    0.5067
                  ]
                },
                {
                  "label": {
                    "zh": "数据集 C",
                    "en": "Dataset C"
                  },
                  "range": [
                    0.4314,
                    0.5491
                  ]
                }
              ]
            }
          ],
          "note": {
            "zh": "先在每个故事内部算相关，再做 Fisher 平均。数值更高，结论的边界不变。",
            "en": "Correlation within each story first, then a Fisher average. The values are higher; the limits of the claim are the same."
          }
        }
      ]
    }
  };
})();
