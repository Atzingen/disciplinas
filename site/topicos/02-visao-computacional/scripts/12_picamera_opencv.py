"""Captura a câmera Raspberry Pi e mostra bordas com OpenCV."""
import cv2
from picamera2 import Picamera2


camera = Picamera2()
configuracao = camera.create_preview_configuration(
    main={"size": (1280, 720), "format": "RGB888"},
)
camera.configure(configuracao)
camera.start()

try:
    while True:
        # Apesar do nome libcamera RGB888, o array fica em ordem BGR para OpenCV.
        quadro_bgr = camera.capture_array("main")
        cinza = cv2.cvtColor(quadro_bgr, cv2.COLOR_BGR2GRAY)
        bordas = cv2.Canny(cinza, 80, 160)
        cv2.imshow("Bordas na Raspberry Pi", bordas)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
finally:
    camera.stop()
    cv2.destroyAllWindows()
