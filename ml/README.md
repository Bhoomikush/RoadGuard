# RoadGuard ML Module

This directory contains the machine learning environment and dataset preparation scripts for RoadGuard AI. Currently, it is configured to use YOLOv8 via Ultralytics for road hazard detection.

## Purpose

The purpose of this module is to isolate the machine learning workflow from the web backend and frontend. It includes scripts to download, inspect, prepare, and validate training datasets before initiating model training. **Note that full training has NOT been performed yet.**

## Dataset Source

- **Name**: MWPD + RDD India/Japan Dataset
- **Kaggle**: `badri467/mwpd-rdd-india-japan-dataset`

## Preparation Steps

1.  **Download**: The raw Kaggle dataset is downloaded to `datasets/raw/mwpd_rdd`.
2.  **Inspect**: The structure and content are verified.
3.  **Map Classes**: Raw dataset classes are mapped to RoadGuard's specific targets (see below).
4.  **Prepare**: Bounding boxes are converted to YOLO normalized format, and images/labels are split into `train` and `val` under `datasets/roadguard_yolo`.
5.  **Validate**: The finalized YOLO dataset is checked for structural integrity and valid label formatting.

## RoadGuard Class Mapping

Source dataset annotations containing multiple crack types are merged into a single `crack` class. Potholes remain as `pothole`.

- `0`: crack
- `1`: pothole

(See `datasets/class_mapping.yaml` for exact source-to-target mapping).

## YOLO Dataset Structure

```
datasets/roadguard_yolo/
├── data.yaml        # YOLO configuration
├── images/
│   ├── train/
│   └── val/
└── labels/
    ├── train/
    └── val/
```

## Environment Setup

The ML scripts run in an isolated virtual environment (`ml/venv`) with dependencies managed via `ml/requirements.txt`.

Required dependencies:
`ultralytics`, `opencv-python`, `numpy`, `pandas`, `matplotlib`, `scikit-learn`, `pyyaml`, `Pillow`, `kaggle`

## Available Scripts

Run these scripts from the `ml/venv` environment:

- **Dataset Validation Command**:
  ```bash
  python scripts/validate_dataset.py
  ```
- **Preview Command** (Generates images with drawn bounding boxes in `datasets/preview`):
  ```bash
  python scripts/preview_dataset.py
  ```
- **YOLO Setup Test Command** (Verifies Ultralytics installation and model loading without training):
  ```bash
  python scripts/test_yolo_setup.py
  ```
