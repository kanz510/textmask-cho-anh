# Textmask Studio · Textmask cho ảnh

Công cụ phủ chữ (text mask/watermark) và logo lên ảnh, xử lý **hoàn toàn trong trình duyệt**. Không upload ảnh lên máy chủ.

**Mở ứng dụng:** https://kanz510.github.io/textmask-cho-anh/

## Trên iPhone / Android

Giao diện Light Liquid Glass, mobile-first với nền trắng ngọc trai: kính mờ nhiều lớp, viền phản chiếu, ánh sáng hồng-lavender và khung xem trước rộng. Thanh công cụ cố định dưới màn hình:

- **Ảnh:** chọn ảnh từ thư viện hoặc Files.
- **Chữ:** nhập nội dung và chọn một trong 11 phông chữ.
- **Kiểu:** 10 bố cục phủ chữ, 6 preset và 7 hiệu ứng.
- **Chỉnh:** điều chỉnh cỡ chữ, độ mờ, khoảng cách, góc xoay, màu, logo và trang trí bằng các thanh trượt/nút chạm.
- **Xuất:** hiện ảnh đã sửa, chọn từng ảnh để tải hoặc mở bảng chia sẻ chọn **Lưu hình ảnh** trên iPhone.

Thanh công cụ dạng kính nổi phía dưới. Bảng chỉnh sửa Liquid Glass có thể kéo xuống bằng tay nắm, đóng bằng nút **×** hoặc chạm vùng nền mờ. Nút **⋯** phía trên mở ảnh mẫu và chọn nhiều ảnh. Trên desktop, toàn bộ panel điều khiển vẫn xuất hiện cạnh khung ảnh như trước.

Có thể **Thêm vào Màn hình chính** trên trình duyệt hỗ trợ. Service worker lưu các tệp cục bộ để sử dụng lại khi ngoại tuyến; phông Google có thể không tải khi offline và sẽ thay bằng font hệ thống.

## Tính năng lõi (không thay đổi)

- 10 kiểu phủ chữ, 11 phông, 7 hiệu ứng, 6 mẫu có sẵn, logo watermark.
- Áp dụng công thức đã lưu cho danh sách ảnh chờ, chọn và tải riêng ảnh đã sửa ở độ phân giải gốc; chia sẻ qua Web Share API để chọn Lưu hình ảnh trong Photos (không tự ghi thẳng vào album).
- Canvas vẽ và thuật toán xử lý ảnh vẫn giữ tại `index.html`. Giao diện mobile và điều hướng tách thành `mobile-ui.css`, `mobile-ui.js`. Giao diện dùng hiệu ứng kính mờ và chuyển động tôn trọng cài đặt Reduce Motion.

## Kiểm thử thủ công nên chạy trước khi phát hành

1. iPhone Safari kích thước 375, 390, 430px: không có cuộn ngang; khung ảnh luôn hiển thị phía trên thanh công cụ.
2. Chọn ảnh dọc/ngang, chọn ảnh mới từ Files; xem trước giữ đúng tỉ lệ.
3. Mở các mục Chữ, Kiểu, Chỉnh, Xuất; đóng bằng nút × và nền mờ; thử bàn phím iOS khi nhập chữ.
4. Đổi font, preset, hiệu ứng, slider và logo; ảnh preview cập nhật.
5. Lưu công thức, chọn nhiều ảnh, bấm **Áp dụng chung**, chọn công thức đã lưu. Mở **Xuất**, chọn từng ảnh để tải hoặc **Lưu vào Ảnh**, kiểm tra hình có watermark đúng mẫu và kích thước. Thử huỷ chia sẻ và trình duyệt không hỗ trợ.
6. Add to Home Screen; tải một lượt khi có mạng, sau đó thử mở lại offline.

## Phát triển

Mở `index.html` trên trình duyệt là có thể chạy phần lõi. Để kiểm tra PWA/service worker, hãy phục vụ thư mục qua HTTPS hoặc một máy chủ localhost (không phải `file://`).

## Giấy phép

Phông chữ và mẫu dùng trong công cụ là tài nguyên mở miễn phí, lấy cảm hứng phong cách Meitu, không phải tài sản VIP của Meitu.


### Điều chỉnh mật độ phủ chữ

Trong mục **Chỉnh**, thanh **Mật độ phủ chữ** có 5 mức từ **Rất thưa** đến **Dày**. Mặc định là **Rất thưa** để ảnh thoáng hơn. Điều khiển này điều chỉnh khoảng cách lặp của chữ/logo trên các kiểu phủ dạng lưới, chéo, lệch và rải ngẫu nhiên; không thay đổi cỡ chữ hay độ mờ.


### Hiệu chỉnh mật độ theo ảnh tham chiếu

Mức **Rất thưa** là mặc định, dùng khoảng cách ngang/dọc lớn hơn rõ rệt để tạo lưới thoáng; kiểu rải ngẫu nhiên và logo lặp cũng giảm số lượng tương ứng. Các mức còn lại giảm dần khoảng cách để tăng mật độ. Kiểu dải ngang và cột dọc cũng dùng cùng nhịp khoảng cách tương ứng.


### V11 · Áp dụng công thức đã lưu và xuất từng ảnh

- **Nhiều ảnh:** Tải ảnh lên để xếp hàng chờ. Thanh trên cùng có nút **Áp dụng chung** ngay cạnh **Xoá tất cả**; không cần kéo xuống.
- **Áp dụng chung:** Bấm nút để mở bảng các **công thức đã lưu**; chọn công thức rồi xác nhận áp dụng cho toàn bộ ảnh chờ. Nếu chưa lưu công thức, vào **Chỉnh → Kho công thức** để lưu trước.
- **Xuất:** Chỉ hiện ảnh đã áp dụng công thức. Chọn một ảnh, bấm nút chính **Lưu vào Ảnh**, rồi chọn **Lưu hình ảnh** trong bảng chia sẻ iPhone. Không hiện nút tải file.
- **Đã loại bỏ:** ZIP, tải hàng loạt, hai nút PNG/JPG, và nút tải file trong tab Xuất. Mục Ảnh tải lên cũng không còn phần Kho công thức trùng lặp; công thức chỉ được lưu/quản lý trong tab Chỉnh.
- Hàng chờ và các công thức lưu cục bộ qua IndexedDB, không gửi ảnh lên máy chủ. Safari có thể thu hồi dữ liệu lưu cục bộ khi dọn dữ liệu hoặc thiếu dung lượng.
