# Textmask Studio · Textmask cho ảnh

Công cụ phủ chữ (text mask/watermark) và logo lên ảnh, xử lý **hoàn toàn trong trình duyệt**. Không upload ảnh lên máy chủ.

**Mở ứng dụng:** https://kanz510.github.io/textmask-cho-anh/

## Trên iPhone / Android

Giao diện Light Liquid Glass, mobile-first với nền trắng ngọc trai: kính mờ nhiều lớp, viền phản chiếu, ánh sáng hồng-lavender và khung xem trước rộng. Thanh công cụ cố định dưới màn hình:

- **Ảnh:** chọn ảnh từ thư viện hoặc Files.
- **Chữ:** nhập nội dung và chọn một trong 11 phông chữ.
- **Kiểu:** 10 bố cục phủ chữ, 6 preset và 7 hiệu ứng.
- **Chỉnh:** điều chỉnh cỡ chữ, độ mờ, khoảng cách, góc xoay, màu, logo và trang trí bằng các thanh trượt/nút chạm.
- **Xuất:** nút **Lưu vào Ảnh** mở bảng chia sẻ hệ thống để chọn **Lưu hình ảnh** trên iPhone; vẫn có tải PNG/JPG theo kích thước gốc và xử lý nhiều ảnh.

Thanh công cụ dạng kính nổi phía dưới. Bảng chỉnh sửa Liquid Glass có thể kéo xuống bằng tay nắm, đóng bằng nút **×** hoặc chạm vùng nền mờ. Nút **⋯** phía trên mở ảnh mẫu và chọn nhiều ảnh. Trên desktop, toàn bộ panel điều khiển vẫn xuất hiện cạnh khung ảnh như trước.

Có thể **Thêm vào Màn hình chính** trên trình duyệt hỗ trợ. Service worker lưu các tệp cục bộ để sử dụng lại khi ngoại tuyến; phông Google có thể không tải khi offline và sẽ thay bằng font hệ thống.

## Tính năng lõi (không thay đổi)

- 10 kiểu phủ chữ, 11 phông, 7 hiệu ứng, 6 mẫu có sẵn, logo watermark.
- Tải PNG/JPG đúng kích thước ảnh gốc, xử lý nhiều ảnh; chia sẻ file PNG với Web Share API để lưu vào Photos theo lựa chọn của người dùng (không có quyền tự ghi thẳng vào album).
- Canvas vẽ và thuật toán xử lý ảnh vẫn giữ tại `index.html`. Giao diện mobile và điều hướng tách thành `mobile-ui.css`, `mobile-ui.js`. Giao diện dùng hiệu ứng kính mờ và chuyển động tôn trọng cài đặt Reduce Motion.

## Kiểm thử thủ công nên chạy trước khi phát hành

1. iPhone Safari kích thước 375, 390, 430px: không có cuộn ngang; khung ảnh luôn hiển thị phía trên thanh công cụ.
2. Chọn ảnh dọc/ngang, chọn ảnh mới từ Files; xem trước giữ đúng tỉ lệ.
3. Mở các mục Chữ, Kiểu, Chỉnh, Xuất; đóng bằng nút × và nền mờ; thử bàn phím iOS khi nhập chữ.
4. Đổi font, preset, hiệu ứng, slider và logo; ảnh preview cập nhật.
5. Chọn **Xuất → Lưu vào Ảnh** trên iPhone Safari, chọn **Lưu hình ảnh** từ bảng chia sẻ rồi kiểm tra ảnh trong Photos; thử Huỷ và trình duyệt không hỗ trợ. Đối chiếu kích thước ảnh gốc, thử PNG/JPG và tải hàng loạt.
6. Add to Home Screen; tải một lượt khi có mạng, sau đó thử mở lại offline.

## Phát triển

Mở `index.html` trên trình duyệt là có thể chạy phần lõi. Để kiểm tra PWA/service worker, hãy phục vụ thư mục qua HTTPS hoặc một máy chủ localhost (không phải `file://`).

## Giấy phép

Phông chữ và mẫu dùng trong công cụ là tài nguyên mở miễn phí, lấy cảm hứng phong cách Meitu, không phải tài sản VIP của Meitu.


### Điều chỉnh mật độ phủ chữ

Trong mục **Chỉnh**, thanh **Mật độ phủ chữ** có 5 mức từ **Thưa** đến **Rất dày**. Mặc định là **Hơi thưa** để ảnh thoáng hơn. Điều khiển này điều chỉnh khoảng cách lặp của chữ/logo trên các kiểu phủ dạng lưới, chéo, lệch và rải ngẫu nhiên; không thay đổi cỡ chữ hay độ mờ.
