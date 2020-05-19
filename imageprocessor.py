import cv2

im = cv2.imread('/home/ubuntu/watershed-app/images/pic.jpg')

print(im)

print(type(im))
# <class 'numpy.ndarray'>

print(im.shape)
# (225, 400, 3)

print(im.dtype)
# uint8
