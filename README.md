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
- **Xuất:** Hiển thị tất cả ảnh đã tải lên, gồm **Chưa chỉnh**, **Đã chỉnh thủ công**, **Đã áp dụng công thức**. Chọn từng ảnh và bấm **Lưu vào Ảnh**, sau đó chọn **Lưu hình ảnh** trong bảng chia sẻ iPhone. Ảnh chưa chỉnh được xuất nguyên bản không thêm watermark.
- **Đã loại bỏ:** ZIP, tải hàng loạt, hai nút PNG/JPG, và nút tải file trong tab Xuất. Mục Ảnh tải lên cũng không còn phần Kho công thức trùng lặp; công thức chỉ được lưu/quản lý trong tab Chỉnh.
- Hàng chờ và các công thức lưu cục bộ qua IndexedDB, không gửi ảnh lên máy chủ. Safari có thể thu hồi dữ liệu lưu cục bộ khi dọn dữ liệu hoặc thiếu dung lượng.


### V13 · Tất cả ảnh đều xuất được

- Ảnh được chọn từ tab **Ảnh** (một ảnh) cũng được tự đưa vào danh sách **Đã tải lên**. Ảnh nhiều từ mục **Nhiều ảnh** tiếp tục hoạt động bình thường.
- Tab **Xuất** không còn lọc theo công thức. Mọi ảnh đã tải lên đều hiện, phân biệt **Chưa chỉnh**, **Đã chỉnh thủ công**, và **Đã áp dụng công thức**.
- Nếu chưa sửa gì, ảnh được xuất không watermark. Khi chọn một ảnh trong danh sách chờ và dùng các công cụ Chữ/Kiểu/Chỉnh, cấu hình chỉnh tay được lưu riêng vào chính ảnh đó (IndexedDB), không bắt buộc tạo/lưu công thức.
- Chọn lại ảnh đã chỉnh để tiếp tục sửa; các ảnh còn lại giữ nguyên chỉnh sửa của chúng. Khi nhấn **Áp dụng chung**, công thức đã chọn được gắn vào toàn bộ ảnh chờ như trước.
- **Lưu vào Ảnh** vẫn dùng Web Share của Safari và yêu cầu chọn **Lưu hình ảnh** từ bảng chia sẻ hệ thống.


### V13.1 · Tối ưu hiệu năng iPhone, giữ nguyên giao diện

- Gộp các lần vẽ preview liên tiếp bằng requestAnimationFrame; canvas xem trước tối đa 1400px, không giảm độ phân giải xuất.
- Cache mẫu kiểu chữ, chỉ làm mới khi thuộc tính liên quan thay đổi.
- Chỉ dựng danh sách Nhiều ảnh và Xuất khi tab đang mở.
- Tạo thumbnail 280px lần lượt cho các ảnh tải lên, tránh để nhiều ảnh gốc 12MP bị giải mã cùng lúc trong danh sách.
- Debounce chỉnh thủ công 450ms trước khi lưu, vẫn lưu khi đổi ảnh và khi mở Xuất.
- Sửa kiểm tra phiên bản thumbnail khi khôi phục công thức từ IndexedDB.
- Không thay đổi bố cục, logic công thức, cách lưu một ảnh vào album iPhone; không thêm ZIP hay nút tải file.
- Kiểm tra tĩnh và cú pháp JS đã chạy; chưa đo FPS hoặc RAM trực tiếp trên Safari iPhone.


### V13.2 · Sửa bố cục iPhone, giữ nguyên chức năng

- Header Nhiều ảnh / menu được đặt bên dưới vùng an toàn status bar/Dynamic Island khi mở PWA độc lập.
- Sửa việc dùng visualViewport.height cho toàn bộ màn hình; chỉ dùng khi bàn phím ảo thực sự mở, tránh khoảng trống dưới dock.
- Tinh chỉnh khung xem trước để giữ trọn ảnh nhưng bỏ nền caro lớn, giảm bóng và tăng cảm giác gọn gàng.
- Thanh công cụ gần mép đáy an toàn hơn, nhãn Xuất có tương phản rõ trên nền sáng.
- Không đụng logic chỉnh ảnh, xuất ảnh gốc, công thức, IndexedDB và chức năng Lưu vào Ảnh.
- Chưa thực hiện đo trực tiếp các tọa độ và safe area trên Safari/iPhone thực tế. Duy trì giới hạn này trong báo cáo kiểm thử.


### V13.3 · Thanh công cụ bám mép dưới iPhone

- Chuyển thanh điều hướng từ pill nổi cao phía trên mép đáy thành thanh full-width chạm đúng đáy viewport, bo hai góc trên. Không còn khoảng nền trống bên dưới thanh điều hướng.
- Dành vùng cho home indicator bằng padding **bên trong** dock, giới hạn safe-area trên iPhone tránh sai số bất thường. Màn hình ngang cũng dùng chiều cao phù hợp.
- Tự tăng vùng ảnh hiển thị còn lại tương ứng. Giữ nguyên các tab, chức năng và logic xuất ảnh sang album.
- Đã xác nhận cú pháp/cấu trúc CSS và cập nhật cache; chưa kiểm thử trực tiếp Safari trên máy thật.


### V13.4 · Khắc phục cache iPhone/PWA

- Xác nhận bản V13.3 đã được GitHub Pages triển khai thành công, nhưng thiết bị có thể giữ HTML/tài nguyên cũ qua cache.
- Nâng đồng bộ query version cho toàn bộ CSS/JS sang `20261114-4` và thêm `meta textmask-build=13.4`.
- Service worker mới ưu tiên mạng và bỏ HTTP disk cache cho HTML/CSS/JS; fallback HTML offline giữ ở một cache key ổn định, tránh nhân bản trang theo từng query.
- Khi tải trang, đăng ký SW với `updateViaCache:'none'` và gọi `registration.update()`.
- Thêm trong menu ••• nút **Cập nhật ứng dụng**, kiểm tra HTML mới trực tiếp, xoá **chỉ** các cache Textmask cũ, rồi chuyển về `index.html?v=13.4`.
- Không xoá IndexedDB, ảnh tải lên, công thức đã lưu hay thay đổi bộ máy chỉnh ảnh. Không reload bất ngờ trong lúc chỉnh ảnh.
- Chưa thử trực tiếp trên PWA iPhone; nếu khoảng trống đáy vẫn còn sau khi đã xác minh V13.4, cần đo innerHeight, visualViewport.height, dock.getBoundingClientRect() và safe-area trên thiết bị.


### V13.5 · Sửa ảnh mẫu, font và đo lỗi dock trên iOS standalone

- Chú thích ảnh mẫu: đo chiều rộng chữ bằng Canvas measureText trước khi vẽ pill, tránh tràn chữ.
- Tải tường minh Be Vietnam Pro (600/500) và Playfair Display (600/700) rồi vẽ lại ảnh mẫu nếu người dùng chưa chọn ảnh riêng.
- Trong iPhone dọc: bù 5px lề trên/dưới của 4 icon thường để nhãn ngang hàng với Xuất.
- PWA standalone dọc: ép `--mobile-safe-bottom:20px` bằng selector `html:root` để kiểm tra giả thuyết CSS safe-area bất thường; không thay đổi các trường hợp landscape/Safari tab.
- Chạm dòng `Textmask Studio V13.5` trong menu ••• để xem số đo `screen.height`, `innerHeight`, `visualViewport.height`, custom property safe-bottom và `dock.getBoundingClientRect()`; chạm lại để ẩn. Debug không lưu dữ liệu và không can thiệp chức năng.
- Giữ nguyên logic batch, kho công thức, lưu ảnh iPhone và IndexedDB. Tăng đồng bộ cache key và CSS/JS asset version.
- **Hạn chế:** chưa xác minh nguyên nhân cuối của vùng trống trên iPhone thật. Có báo cáo WebKit về standalone viewport bị ngắn hơn màn hình vật lý; nếu số đo cho thấy `screen.height - innerHeight` gần bằng khoảng trống, cần dùng kết quả này để quyết định có chỉnh viewport-fit/ứng xử theo iOS phiên bản hay không.

- Tương thích với nút cập nhật của V13.4: giữ chuỗi kiểm tra legacy trong HTML comment (không tải CSS cũ) để PWA cũ có thể chuyển lên V13.5.


### V13.6 · Hiển thị chẩn đoán PWA và bù hụt chiều cao viewport

- Khi mở dạng standalone dọc, hiển thị khung debug tạm ở góc trên `position:fixed;top:80px;z-index:9999;font-size:12px` với 5 thông số: `innerHeight`, `screen.height`, `visualViewport.height`, `documentElement.clientHeight`, `mobileDock.getBoundingClientRect().bottom`. Đồng thời hiển thị độ lệch đang được bù.
- Nếu `screen.height` lớn hơn `window.innerHeight` trong khoảng hợp lý 8–140px và không có bàn phím, JS đặt `--pwa-viewport-gap`; CSS kéo body/wrap dài ra và đặt dock `bottom:-gap`, giữ home indicator trong padding của dock. Chỉ áp dụng standalone, màn dọc.
- Nhận biết standalone bằng `display-mode:standalone` hoặc `navigator.standalone`; không tác động tab Safari, màn ngang hay bàn phím ảo. Không đổi logic xuất, batch, công thức, lưu trữ ảnh.
- Bổ sung marker tương thích nút cập nhật từ V13.4/V13.5. Nâng cache và phiên bản CSS/JS thành V13.6.
- **Cần kiểm thử trên iPhone thực tế**: đây là bù viewport dựa vào thông số trình duyệt, chưa có phép đo trực tiếp từ thiết bị. Nếu dock còn cách đáy, chụp khung debug để xác định sai lệch.


### V13.7 · Sửa kích thước HTML 812px/874px trên iPhone PWA

- Dữ liệu debug thật từ iPhone người dùng: `innerHeight=874`, `screen.height=874`, `visualViewport.height=874`, `documentElement.clientHeight=812`, `mobileDock.getBoundingClientRect().bottom=874`. Khoảng thiếu **62px nằm ở HTML root**, không phải vị trí dock.
- Trong PWA standalone màn dọc và không mở bàn phím: đặt `--app-height=window.innerHeight + 'px'` để `html`, `body`, `.wrap` sử dụng chiều cao thật.
- Xoá cơ chế bù sai `--pwa-viewport-gap` dựa vào `screen.height - window.innerHeight`. Dock giữ đúng `bottom:0`, home indicator vẫn nằm trong padding của dock.
- Giữ khung debug tạm để kiểm tra `documentElement.clientHeight` và `dock.bottom` sau khi sửa; xem thêm `innerHeight − clientHeight`. Sau khi xác nhận bằng iPhone sẽ gỡ khung debug.
- Không thay logic chỉnh ảnh, IndexedDB, batch, kho công thức hoặc Lưu vào Ảnh. Nâng phiên bản CSS/JS, SW cache và giữ marker cho nút Cập nhật từ bản V13.4–V13.6.
