"""Tiny YOLOv4 COCO num OAK-D com DepthAI v2 e um BLOB compatível."""
from pathlib import Path
import sys

import cv2
import depthai as dai


if len(sys.argv) != 2:
    raise SystemExit("Uso: python scripts/14_oakd_blob.py tiny-yolov4-coco.blob")

blob = Path(sys.argv[1])
if not blob.exists():
    raise SystemExit(f"Não encontrei {blob}")

pipeline = dai.Pipeline()
camera = pipeline.create(dai.node.ColorCamera)
detector = pipeline.create(dai.node.YoloDetectionNetwork)
quadros = pipeline.create(dai.node.XLinkOut)
deteccoes = pipeline.create(dai.node.XLinkOut)
quadros.setStreamName("quadros")
deteccoes.setStreamName("deteccoes")

camera.setPreviewSize(416, 416)
camera.setInterleaved(False)
camera.setColorOrder(dai.ColorCameraProperties.ColorOrder.BGR)
detector.setBlobPath(str(blob))
detector.setConfidenceThreshold(0.5)
detector.setNumClasses(80)
detector.setCoordinateSize(4)
detector.setAnchors([10, 14, 23, 27, 37, 58, 81, 82, 135, 169, 344, 319])
detector.setAnchorMasks({"side26": [1, 2, 3], "side13": [3, 4, 5]})
detector.setIouThreshold(0.5)

camera.preview.link(detector.input)
detector.passthrough.link(quadros.input)
detector.out.link(deteccoes.input)

with dai.Device(pipeline) as dispositivo:
    fila_quadros = dispositivo.getOutputQueue("quadros", 4, True)
    fila_deteccoes = dispositivo.getOutputQueue("deteccoes", 4, True)
    while True:
        quadro = fila_quadros.get().getCvFrame()
        for objeto in fila_deteccoes.get().detections:
            altura, largura = quadro.shape[:2]
            p1 = (int(objeto.xmin * largura), int(objeto.ymin * altura))
            p2 = (int(objeto.xmax * largura), int(objeto.ymax * altura))
            cv2.rectangle(quadro, p1, p2, (0, 255, 0), 2)
            cv2.putText(quadro, f"classe {objeto.label}: {objeto.confidence:.2f}",
                        p1, cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1)
        cv2.imshow("OAK-D", quadro)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
