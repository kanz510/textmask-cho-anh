# Textmask Studio · Textmask cho ảnh

Công cụ phủ chữ (text mask/watermark) và logo lên ảnh, xử lý **hoàn toàn trong trình duyệt**. Không upload ảnh lên máy chủ.

**Mở ứng dụng:** https://kanz510.github.io/textmask-cho-anh/

## Trên iPhone / Android

Giao diện dark mode, mobile-first theo concept Liquid Glass: kính mờ nhiều lớp, viền phản chiếu, ánh sáng hồng-lavender và khung xem trước rộng. Thanh công cụ cố định dưới màn hình:

- **Ảnh:** chọn ảnh từ thư viện hoặc Files.
- **Chữ:** nhập nội dung và chọn một trong 11 phông chữ.
- **Kiểu:** 10 bố cục phủ chữ, 6 preset và 7 hiệu ứng.
- **Chỉnh:** điều chỉnh cỡ chữ, độ mờ, khoảng cách, góc xoay, màu, logo và trang trí bằng các thanh trượt/nút chạm.
- **Xuất:** tải PNG/JPG theo kích thước gốc, chọn nhiều ảnh và tải hàng loạt.

Thanh công cụ dạng kính nổi phía dưới. Bảng chỉnh sửa Liquid Glass có thể kéo xuống bằng tay nắm, đóng bằng nút **×** hoặc chạm vùng nền mờ. Nút **⋯** phía trên mở ảnh mẫu, chọn nhiều ảnh hoặc xem trợ giúp. Trên desktop, toàn bộ panel điều khiển vẫn xuất hiện cạnh khung ảnh như trước.

Có thể **Thêm vào Màn hình chính** trên trình duyệt hỗ trợ. Service worker lưu các tệp cục bộ để sử dụng lại khi ngoại tuyến; phông Google có thể không tải khi offline và sẽ thay bằng font hệ thống.

## Tính năng lõi (không thay đổi)

- 10 kiểu phủ chữ, 11 phông, 7 hiệu ứng, 6 mẫu có sẵn, logo watermark.
- Tải PNG/JPG đúng kích thước ảnh gốc, xử lý nhiều ảnh.
- Kéo thả ảnh, dán ảnh và phím tắt trên desktop: Ctrl/Cmd+O, Ctrl/Cmd+S, Ctrl/Cmd+Shift+S, phím 1–0 chọn kiểu.
- Canvas vẽ và thuật toán xử lý ảnh vẫn giữ tại `index.html`. Giao diện mobile và điều hướng tách thành `mobile-ui.css`, `mobile-ui.js`. Giao diện dùng hiệu ứng kính mờ và chuyển động tôn trọng cài đặt Reduce Motion.

## Kiểm thử thủ công nên chạy trước khi phát hành

1. iPhone Safari kích thước 375, 390, 430px: không có cuộn ngang; khung ảnh luôn hiển thị phía trên thanh công cụ.
2. Chọn ảnh dọc/ngang, chọn ảnh mới từ Files; xem trước giữ đúng tỉ lệ.
3. Mở các mục Chữ, Kiểu, Chỉnh, Xuất; đóng bằng nút × và nền mờ; thử bàn phím iOS khi nhập chữ.
4. Đổi font, preset, hiệu ứng, slider và logo; ảnh preview cập nhật.
5. Tải PNG/JPG; đối chiếu kích thước tệp gốc, thử chọn và tải nhiều ảnh.
6. Mở desktop 1024px+ và kiểm tra phím tắt cũ; xoay ngang điện thoại; thử VoiceOver và Reduce Motion.
7. Add to Home Screen; tải một lượt khi có mạng, sau đó thử mở lại offline.

## Phát triển

Mở `index.html` trên trình duyệt là có thể chạy phần lõi. Để kiểm tra PWA/service worker, hãy phục vụ thư mục qua HTTPS hoặc một máy chủ localhost (không phải `file://`).

## Giấy phép

Phông chữ và mẫu dùng trong công cụ là tài nguyên mở miễn phí, lấy cảm hứng phong cách Meitu, không phải tài sản VIP của Meitu.
