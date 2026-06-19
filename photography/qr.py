import qrcode

qr = qrcode.QRCode(
    version=1,
    box_size=20,
    border=4,
)

qr.add_data("https://www.instagram.com/fisch.flickz?igsh=MWZ1emJtZ245enRxeA%3D%3D&utm_source=qr")
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")
img.save("instagram-qr.png")