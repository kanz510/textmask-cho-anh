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


### Hiệu chỉnh mật độ theo ảnh tham chiếu

Mức **Rất thưa** là mặc định, dùng khoảng cách ngang/dọc lớn hơn rõ rệt để tạo lưới thoáng; kiểu rải ngẫu nhiên và logo lặp cũng giảm số lượng tương ứng. Các mức còn lại giảm dần khoảng cách để tăng mật độ. Kiểu dải ngang và cột dọc cũng dùng cùng nhịp khoảng cách tương ứng.


### UI photo-first (V9)

Mobile ẩn branding ở header, giảm chiều cao header/dock, tăng khung preview. Nút **Nhiều ảnh** ở trên bên trái mở bảng 3 bước: chọn ảnh, chỉnh mẫu chung rồi **Áp dụng & tải tất cả PNG**. Tải áp dụng thiết lập hiện tại cho toàn bộ ảnh; có trạng thái, số ảnh đã chọn. Giữ tính năng lưu ảnh và tải PNG/JPG.


### V10 · Ảnh đã tải lên và kho công thức
- **Nhiều ảnh** hiển thị danh sách ảnh chờ, ảnh thu nhỏ, trạng thái đã áp dụng, chọn để xem trước, xoá ảnh hoặc tải thêm.
- Hàng chờ sử dụng IndexedDB trong trình duyệt trên thiết bị để giữ ảnh khi đóng và mở lại. Safari vẫn có thể thu hồi dữ liệu khi thiếu dung lượng hoặc xoá dữ liệu trang. Nếu không hỗ trợ lưu, hàng chờ chỉ ở trong phiên.
- Sửa kiểu phủ chữ hiện tại rồi bấm **Áp dụng công thức cho tất cả** để chốt bản chỉnh cho toàn bộ ảnh chờ. Các thay đổi sau đó không tự thay đổi các ảnh đã chốt, cần bấm Áp dụng lại.
- **Tải bộ ảnh** tạo 1 tệp ZIP chứa PNG riêng cho từng ảnh (không tải đồng loạt từng file, để tiện trên Safari iPhone).
- Công thức có thể đặt tên, lưu, áp dụng lại và xoá. Bao gồm phông, nội dung, kiểu, màu, mật độ, góc xoay, hiệu ứng và logo (logo được thu gọn để lưu cục bộ).
- Ảnh và công thức được xử lý trên thiết bị, không có tải dữ liệu lên máy chủ.


**Tải bộ ảnh:** Nhấn **Tạo bộ ảnh ZIP**, sau khi xử lý xong sẽ xuất hiện nút **Tải ZIP vừa tạo**. Chạm nút này để lưu vào ứng dụng Tệp của iPhone. Cần chạm lần thứ hai do Safari thường chặn tải nhiều tệp sau các thao tác xử lý bất đồng bộ.
