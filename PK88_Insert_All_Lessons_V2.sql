
-- ==================================================
-- KHẮC PHỤC DỮ LIỆU: CẤU TRÚC ĐÚNG CHUẨN 60 NGÀY
-- ==================================================

-- 1. Dọn dẹp toàn bộ dữ liệu bài học cũ bị sai lệch
DELETE FROM lessons;
DELETE FROM staff_progress;

DO $$ 
DECLARE
    course_id UUID;
BEGIN
    SELECT id INTO course_id FROM courses LIMIT 1;

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        1, 
        'Hội Nhập: Tầm Nhìn, Sứ Mệnh & Văn Hóa Doanh Nghiệp', 
        'Chào mừng bạn đến với Đại gia đình Phụ Kiện 88!

- Tầm nhìn: Trở thành chuỗi bán lẻ phụ kiện điện thoại và dịch vụ sửa chữa hàng đầu khu vực miền Tây.
- Sứ mệnh: Mang đến sản phẩm chất lượng, dịch vụ tận tâm và trải nghiệm mua sắm hiện đại thông qua tự động hóa AI toàn diện.
- Văn hóa: Tận tâm phục vụ khách hàng, Trung thực với tổ chức, Trách nhiệm với công việc.
- Nội quy cơ bản: Luôn mặc đồng phục chỉnh tề, giữ thái độ niềm nở và đảm bảo vệ sinh cửa hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        2, 
        'Hội Nhập: Quy Định Chấm Công GPS & Lương Thưởng', 
        'Quy định làm việc tại cửa hàng:

- Giờ làm việc: Phân ca linh hoạt theo sự sắp xếp của quản lý trực tiếp.
- Hệ thống Chấm công: Sử dụng 100% Web App tự động. Yêu cầu tính năng định vị (Geofencing). Bạn phải đứng trong bán kính 100m của cửa hàng để Check-in/Check-out.
- Lương Thưởng: Áp dụng mức lương cơ bản theo giờ, cộng thưởng hoa hồng khi đạt doanh số hoặc Upsell thành công.
- Chế độ đãi ngộ: Theo quy định của PK88 và hệ thống đánh giá tự động hàng tháng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        3, 
        'Hội Nhập: Làm Quen Đội Nhóm & Không Gian Cửa Hàng', 
        'Mục tiêu ngày thứ 3:

1. Làm quen và tương tác với các anh chị nhân viên cũ.
2. Tham quan các khu vực trưng bày: Tủ Cường Lực, Kệ Ốp Lưng, Khu Vực Phụ Kiện Công Nghệ, Bàn Kỹ Thuật.
3. Quan sát từ xa cách một nhân viên chốt Sale và thao tác thanh toán.
4. Thực hành vệ sinh, sắp xếp hàng hóa đầu giờ và cuối giờ.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        4, 
        'Kiến Thức Về Cường  Lực', 
        'Có 3 loại cường lực chính :

- Cường lực trong suốt.

- Cường lực chống nhìn trộm.

- Cường lực chống vân tay.



- Cường lực Android :

Cường lực các dòng S24Ultra, S25Ultra : Kính trong Anank 269k - Kính chống nhìn trộm Anank 299k.

Cường lực trong suốt loại thường có giá : 30k (vừa màn hình sáng bên trong)

Cường lực trong đầy màn hình: 60k, 100k.

- Cường lực iphone :

KÍNH TRONG SUỐT

Cường lực trong suốt loại thường có giá : 30k (vừa màn hình sáng bên trong)

Đầy màn hình: 60k, 100k.

Cao cấp:

250k giảm còn 150k (KINGKONG)

300k giảm còn 200k (WIWU)

380k giảm còn 300k (WIWU)

500k giảm còn 399k (HODA, WIWU).

KÍNH CHỐNG NHÌN TRỘM

Loại thường: 148k

Tốt hơn :

199k (KINGKONG)

299k (WIWU, ANANK)

399k (NILLKIN)

599k (HODA).

KÍNH CHỐNG VÂN TAY

148K (KINGKONG)

- Khác nhau giữa loại thường và loại tốt :

Loại tốt hơn sẽ có phủ nhiều nano hơn,mượt mà,chống chịu lực tốt hơn, chống ánh sáng xanh và tia uv sử dụng lâu đỡ mỏi mắt.

- Bảo Hành Cường Lực : Bảo hành 45 ngày

Trường hợp trầy xước, rơi vỡ, cấn bể cường lực khách hàng sẽ được giảm 50% khi dán lại.

Trường hợp kính bị bong keo hoặc cảm ứng không ăn, không nhạy (cường lực không dính bụi) khách hàng sẽ được dán lại miễn phí.

CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1. Cường lực anh/chị không làm gì mà cũng nứt bể vậy em?- Cường lực cũng là dạng kính nên cũng sẽ bị nứt như thường , nhiều khi các cạnh của kính cọ sát vào chìa khóa hoặc mặt bàn. Mình nên dùng ốp lưng thì sẽ hạn chế được tình trạng này ạ ( Đối với trường hợp vết nứt không có dấu hiệu bị va chạm sẽ bảo hành 100% ).

2. Dán cường lực mà rớt lại bị bể màn hình máy là sao em? - Dù là loại tốt, kính cường lực vẫn có thể vỡ khi điện thoại bị rơi mạnh hoặc rơi ở góc, vì góc máy đặc biệt nhạy cảm. Mục đích chính của kính cường lực là hấp thụ lực tác động và bảo vệ màn hình chính, nên nếu kính cường lực bị vỡ, màn hình điện thoại thường vẫn được bảo vệ tốt hơn so với khi không có kính.3. Cường lực dán bảo hành có 45 ngày vậy em? ( ít quá )- Dạ, cường lực dán bên em bảo hành 45 ngày là mức được áp dụng chung để đảm bảo quyền lợi cho khách hàng trong quá trình sử dụng ban đầu. Thực tế, cường lực là sản phẩm hao mòn theo quá trình dùng hằng ngày nên thời gian bảo hành thường không quá dài. Tuy nhiên trong 45 ngày này, nếu cường lực gặp lỗi bong, nứt do kỹ thuật dán hoặc chất lượng sản phẩm, bên em sẽ hỗ trợ thay mới nhanh chóng để anh/chị yên tâm sử dụng.

4. Dán cường lực về được ít bữa bị nổi bóng là sao em? - Dạ được dán lại miễn phí 100% trong 45 ngày ạ ( Nguyên nhân 1: Do kính lỗi. Nguyên nhân 2: Ốp khít quá bị đẩy kính lên. Nguyên nhân 3: Màn hình đã bị mài kính ).

5.  Sao cường lực CNT có sọc lưới đen nhiều vậy em?- Cường lực chống nhìn trộm có những sọc lưới đen do thiết kế của lớp phủ đặc biệt trên bề mặt kính. Lớp phủ này sử dụng công nghệ vi lưới hoặc các hạt nhỏ tạo nên một góc nhìn hẹp, chỉ cho phép nhìn rõ màn hình từ một góc trực diện. Khi nhìn từ các góc khác, các hạt này gây hiện tượng mờ hoặc tối, ngăn chặn người khác nhìn thấy nội dung trên màn hình.

6. Màn hình cong có cường lực không em?

- màn hình cong hiện tại sẽ không có cường lực do đặc thù màn hình bo cong nên cường lực không ôm khít được. Tuy nhiên bên có ppf bảo vệ chống trầy xước và chống va đạp nhẹ , giúp bảo vệ tốt trong quá trình sử dụng hằng ngày.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        5, 
        'Kiến Thức về PPF', 
        'PPF CẮT MÁY DÁN MẶT TRƯỚC VÀ MẶT SAU

Ppf trong cắt máy, ppf nhám cắt máy giá 80k

PPF CẮT MÁY CHỈ DÁN MẶT TRƯỚC

. PPF phục hồi vết xước (tự phục hồi lại vết xước trên bề mặt miếng dán) giá là 99k.

. PPF UV chất liệu mỏng cứng chống được va đập nhẹ giá 148k

. PPF chống nhìn trộm dẻo 148k

PPF CẮT SẴN CHỈ DÁN MẶT SAU

- Iphone:

. Các loại ip viền tròn có ppf full trong, full nhám giá 150k giảm còn 128k (ip 11, ip xsm, ip 11 promax).

. Các máy ip viền vuông có ppf full trong và full nhám giá 150k giảm còn 128k(bản ppf 3lớp) 200k giảm còn 178k(ppf 4 lớp). Ngoài ra còn có bản 2 lớp viền trong lưng nhám hoặc nhám lưng trong giá 250k giảm còn 200k.Ppf ip 17 thường, ip Air, ip 17 pro, ip 17 promax full nhám giá 250k giảm còn 200.

- Android:

Các dòng SS ULTRA full trong và full nhám giá 150k giảm còn 128k, bản 4 lớp 200k giảm còn 178k, 2 lớp 250k giảm còn 200k.

CHẾ ĐỘ BẢO HÀNH PPF

PPF Mặt Trước: Bảo hành 30 ngày. Trường hợp lướt cảm ứng không ăn, nổi bong bóng - bọt khí bên trong (không dính bụi), được dán lại miễn phí. Trường hợp bong tróc hoặc dính bụi do tự bóc, trầy xước do quá trình sử dụng, giảm 50% khi dán lại.

PPF 3 lớp :Bảo hành 30 ngày. Trường hợp nổi bong bóng - bọt khí ở lưng viền máy (không dính bụi), được dán lại miễn phí.

Trường hợp bong tróc hoặc dính bụi do ra vào ốp lưng hoặc không sử dụng ốp lưng, trầy xước, giảm 50% khi dán lại.

PPF 4 lớp: Bảo hành miễn phí cho khách lần đầu dán nếu bị bong tróc do " Tự Bong, Ra vào ốp lưng bị bong " còn trong thời gian bảo hành , hoặc những lần dán sau lần " Miễn Phí " dán lại hỗ trợ khách giảm 50% trong 30 ngày.( lố 3 ngày vẫn được bảo hành).

CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1.PPF MẶT TRƯỚC LÀ GÌ?

- Là miếng dán mỏng bảo vệ màn hình điện thoại làm từ chất liệu cao cấp không giống như decal thông thường,công dụng chính là chống trầy xước, chống va đập nhẹ,dán ôm sát toàn bộ mặt trước.Khi sử dụng vẫn giữ được độ trong và độ nhạy cảm ứng như màn hình gốc.

2. PPF với cường lực cái nào sài tốt hơn em? - Tùy vào sở thích của khách ạ . Miếng chống trầy PPF thì mỏng và không bị mẻ như cường lực , tuy nhiên sẽ không bảo vệ màn hình khi va đập mạnh như cường lực. Kính cường lực dùng sẽ an toàn cho máy hơn mỗi khi va đập hay rơi rớt ạ . Nếu mình sợ mẻ viền nhưng vẫn chống được va đập nhẹ thì có thể dán PPF UV ạ.3. Sao bên mình không dán full ra viền màn hình mà phải dán nhỏ vậy em? - Một số ốp lưng ôm sát máy , vì vậy dán full màn thường dễ bị cấn và bong tróc ạ.4. Anh/chị mới dán mà bị chạy PPF rồi em?- Dạ được dán bảo hành miễn phí trong 30 ngày ạ . Một số màn hình được phủ nao cao cấp nên độ mượt rất cao khiến độ bám của PPF bị hạn chế , đặc biệt các máy màn hình cong đời cao . Mình có thể chuyển qua dán PPF UV ạ .

5. Dán PPF rớt có bể không em?- Dạ PPF chỉ có tác dụng chống trầy , không chống được va đập nên mình dùng máy cẩn thẩn ạ.

6. Dán có bị nóng máy không em ?- Dạ không , PPF USA là miếng dán cao cấp , có cơ chế co giãn thoát khí nên không gây nóng máy .

7. Anh có sài ốp lưng dán cái đó chi em? Có tác dụng gì ?- Dạ ốp lưng có tác dụng bảo vệ máy khi bị rơi rớt hay va đập mạnh , mình dùng một thời gian cát bụi lọt vào vẫn làm máy bị trầy xước và nước + hơi ẩm bám trên máy khiến máy bị oxy hóa ạ ( cho khách xem hình ảnh ).

8. Khi dán xong một thời gian bóc ra có để lại keo hay bị tróc sơn như decal không em? - Dạ không , keo của PPF là loại chất lượng cao, được thiết kế để bám chắc chắn nhưng vẫn có thể gỡ bỏ mà không để lại cặn keo hay gây hại cho bề mặt điện thoại ạ .

9. Dán PPF xong không dùng ốp lưng được không? ( không có ốp luôn được không? )- Dạ được ạ .Tuy nhiên mình nên sử dụng ốp trong 7 ngày đầu để keo bám chắc hơn ạ, nếu được mình nên sử dụng ốp lưng để chống va đập cho máy vì ppf không có tác dụng đó như ốp lưng ạ.

10. Dán PPF không hấp được ko ?- Dạ được , mình có thể yêu cầu nhân viên trước khi dán ,mình về dùng 7-10 ngày keo sẽ tự tan đều ạ .'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        6, 
        'Kiến Thức Về Len Bảo Vệ Camera', 
        '- Bảo vệ Camera iPhone :

. Camera iPhone 11/12/12mini : 119k ( URR )

. Camera iPhone 11Pro/11Promax/12Pro : 148k ( URR )

. Camera iPhone 12Promax : 148k ( URR )

. Camera iPhone 13 : 148K ( URR )

. Camera iPhone 13Pro/13Promax : 199k ( Kuzoom, URR )

. Camera iPhone 14/14Plus : 148K ( URR )

. Camera iPhone 14Pro/14Promax : 199k ( URR )

. Camera iPhone 15/15Plus : 148k ( URR )

. Camera iPhone 15Pro/15Promax : 199k ( Kuzoom ) - 600k giảm còn 499k ( Hoda )

. Camera iPhone 16/16Plus : 119k ( Kuzoom ) - 299k ( Hoda )

. Camera iPhone 16Pro/16Promax : 199k ( Kuzoom ) - 299k ( URR Sapphire ) - 600k giảm còn 499k ( Hoda )

. Camera iPhone 17 : 169k ( URR ) - 209k ( Anank )

. Camera iPhone 17Pro/17Promax : 199k ( URR ) - 299k ( URR Sapphire ) - 600k giảm còn 499k ( Hoda )

- Bảo Vệ Camera Samsung :

. Camera Samsung S22Ultra

. Camera Samsung S23Ultra

. Camera Samsung S24Ultra

. Camera Samsung S25Ultra

Đồng GIÁ 199K THƯƠNG HIỆU KUZOOM

SỰ KHÁC NHAU GIỮA LOẠI THƯỜNG VÀ LOẠI TỐT HƠN

. Loại thường bảo vệ ở mức cơ bản,chống trầy xước và chống oxi hoá viền camera

. Loại tốt hơn có độ chống chịu lực tốt hơn, hạn chế trầy xước trên bề mặt kính, hạn chế bám dấu vân tay,bền bỉ hơn.

CHẾ ĐỘ BẢO HÀNH LENS CAMERA

- Bảo hành 30 ngày.

- Trường hợp chụp hình bị mờ, bị chá sáng, bị giảm độ phân giải hoặc lens tự động rơi ra sẽ được dán lại miễn phí. Trường hợp bị trầy xước - cấn bể trong quá trình sử dụng, giảm 50% khi dán lại.

CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1.Dán len camera có ảnh hưởng đến chất lượng ảnh chụp không?

- Không ảnh hưởng, len sử dụng kính trong suốt, không làm mờ ảnh hay giảm độ nét khi chụp hình, quay video,có bảo hành cho khách 30 ngày trường hợp này.

2.Dán camera có cần thiết không ?

-Rất cần thiết,camera là bộ phận lồi,dễ trầy xước và nứt vỡ khi va chạm,dán bảo vệ giúp chống trầy xước, giảm rủi ro hư camera, chi phí thay camera rất cao.

3.Dán camera có dễ bị bong ra không?-Em có bảo hành tự bong tróc sẽ bảo hành lại ạ,tuy nhiên miếng dán có keo chuyên dụng ,bám khá chắc chắn ạ.

4.Dán rồi có tháo ra được không?

-Tháo được bình thường,không ảnh hưởng gì đến camera, khi cần thay mới kĩ thuật sẽ tháo nhẹ nhàng, không làm trầy kính camera.

5.Có cần dán camera khi đã sử dụng ốp lưng không?

-Nên dán ạ,ốp chỉ bảo vệ xung quanh,còn mặt kính camera vấn có thể trầy khi để úp máy,hoặc cọ sát bề mặt cứng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        7, 
        'Kiến Thức Về Ốp Lưng', 
        '-Ốp silicon dẻo

Ưu điểm :mềm dẻo dễ tháo lấp, không trầy viền máy,ôm sát máy chống trơn trượt chống va đập tốt, giá mềm.

Nhược điểm: dễ ngã vàng theo thời gian đặc biệt là ốp trong suốt.

-Ốp lưng cứng viền mềm

Ưu điểm: lưng không ngã vàng, from dáng đẹp,

Nhược điểm: lưng dễ trầy theo thời gian, giá nhỉn hơn silicon thông thường.

-Bao da

Ưu điểm : bảo vệ toàn diện trước sau viền máy, hạn chế trầy xước khi bỏ túi, để úp máy, lịch sự sang trọng.

Nhược điểm: dày và nặng hơn ốp thong thường,không tiện thao tác nhanh.

-Ốp hình ,ốp màu sắc(in hình,họa tiếc)

Ưu điểm : đẹp, cá tính, thời trang,nhiều mẫu lựa chọn,giá đa dạng,

Nhược điểm: lớp in hình có thể phai màu, tróc theo thời gian,độ bảo vệ thường ở mức cơ bản.

CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1.Dùng ốp có gây nóng máy không?

-Không ảnh hưởng đáng kể, ốp đều có khe tản nhiệt,nên mình sử dụng bình thường không cần quá lo lắng ạ.

2.Máy đã dán bảo vệ hết rồi có cần dùng ốp không?

-Dạ dán bảo vệ máy để chống trầy xước và oxi hóa, còn ốp lưng để chống va đập ạ,mình nên sử dụng ốp lưng để bảo vệ toàn diện máy ạ.

3.Ốp sử dụng thời gian có ố vàng không?

-Có thể ngã vàng theo thời gian,đặc biệt là ốp trong suốt đây là đặc tính của vật liệu rồi ạ, chỉ có ốp full cứng là không vàng nhưng sử dụng rất dễ trầy mấy vì rất cứng và không có độ đàn hồi.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        8, 
        'Kiến Thức Về Cóc - Cáp - Bộ Sạc', 
        'TÌM HIỂU VỀ CÁC LOẠI SẠC IPHONE & ANDROI

- Cáp sạc iPhone :

. USB-Lightning ( Phù hợp các dòng iPhone XSM trở xuống )

. TypeC-Lightning ( Phù hợp các dòng từ iPhone 11 đến 14Promax )

. TypeC-TypeC ( Phù hợp các dòng iPhone 15 trở lên )

- Cáp sạc Androi :

. USB-Micro ( Phù hợp các dòng máy đời thấp )

. USB-TypeC ( Phù hợp các dòng máy tầm trung )

. TypeC-TypeC ( Phù hợp các dòng máy đời cao )

- Cốc sạc :

. Cốc đầu USB (10.5W 18W, 22.5W )

. Cốc đầu TypeC ( 20W trở lên )

. Cốc nhiều đầu ( 2 đầu sạc trở lên )

- Bộ sạc :

. Bộ sạc USB-iPhone : 10.5W, 18W, 22.5W

. Bộ sạc TypeC-ịPhone : 20W trở lên

. Bộ sạc USB-Androi : 10.5W, 18W, 22.5W

. Bộ sạc TypeC-Androi : 20W trở lên

-Các thương hiệu sạc đang kinh doanh : Quaker (hàng Việt Nam), Wiwu ( hàng nội địa Trung Quốc), Pisen ( thương hiệu hàng đầu về phụ kiện), Hoco (Trung Quốc).



CHẾ ĐỘ BẢO HÀNH CÁP - CỐC - BỘ SẠC

- Bảo hành 8 tháng.

- Trường hợp không nhận sạc, sạc chập chờn, tự ngắt sạc. Không bảo hành trường hợp hư hỏng do ngấm nước rơi vỡ, cháy nổ do dùng sai nguồn điện, sản phẩm bị biến dạng.

CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1. Cáp sạc nhanh và cốc không nhanh vậy có sạc nhanh không em?

- Dạ khi sạc thì chỉ truyền tải đủ số W có trên cóc thôi ạ, nếu sử dụng lâu dài sẽ rất dễ bị hư dây hoặc cóc gây ra tình trạng cháy sạc ạ ( tốc độ nhanh nhất bằng tốc độ của phụ kiện có tốc độ yếu nhất ).

2.Dây sạc dài có ảnh hưởng đến tốc độ sạc không ?

- Tốc độ truyền tải tỉ lệ nghịch với chiều dài dây cáp , cáp càng ngắn tốc độ đường truyền càng nhanh ạ .

3. Cốc sạc nhanh sài có nóng cốc và máy không em?- Dạ khi sạc với tốc độ cao sẽ gây ra tình trạng nóng tạm thời khi sạc. Nhưng nếu sạc với những máy không hỗ trợ sẽ dễ bị hư pin máy và cóc ạ.

4. Cáp sạc thì nên xài chất liệu nào để được bền vậy em? - Dạ anh/chị có thể sử dụng chất liệu dây dù để hạn chế bị đứt gẫy hoặc bị cũ dây vì dây dù có khả năng co dãn tốt nên yên tâm về độ bề ạ.

5. Dùng củ sạc và dây sạc khác hãng có sao k?- Dạ không sao ạ,các hãng cáp sạc khi cung cấp ra thị trường đều đã được kiểm tra chất lượng và an toàn cháy nổ , một số hãng ngoài còn tốt hơn vì có chức năng tự điều chỉnh dòng điện.Dây sạc và cóc sạc chỉ cần phù hợp về thông số sạc là có thể sử dụng chung bình thường ạ.

6. Củ sạc hay dây sạc ảnh hưởng đến việc sạc nhanh em?

- Dạ cả dây sạc và củ sạc để ảnh hưởng ạ, vì khi sạc nhanh thì phải phù hợp về thông số sạc và chuẩn theo số W mà máy hỗ trợ ạ.

7. Mấy loại giá cao ngoài sạc nhanh còn ưu điểm gì không em?

- Ngoài sạc nhanh giúp thời gian sạc ngắn hơn còn có thể tiện lợi mang theo khi cần sạc gấp hoặc một số cóc có tính năng tự điều chỉnh dòng điện, bảo vệ khi sạc quá nóng, quá áp, quá dòng giúp bảo vệ máy không bị hư hại & tránh bị chai pin.

8. Cóc sạc nhanh 3 đầu thì sạc cùng lúc 3 máy vẫn còn nhanh hay không ?

- Khi sạc cùng lúc 3 máy dòng điện sẽ bị chia ra nên sẽ là sạc thường ạ.

9. Tất cả các loại cáp đều có thể truyền dữ liệu Data phải không em?

- Dạ, chỉ có những loại nó có hỗ trợ truyền dữ liệu Data mới được ạ. (Trên hộp mỗi loại đều có để thông tin là Charging Data Cable).'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        9, 
        'Kiến Thức Về Sạc Dự Phòng', 
        'Dung lượng (mAh) : là khả năng lưu trữ pin, dung lượng càng cao thì sạc được càng nhiều lần.

Dung lượng thực tế : chị đạt khoảng 60 – 70 % so với số mAh ghi trên sản phẩm do hao hụt năng lượng.

Input/out put: sạc vào/ sạc ra (có loại cổng tyc chỉ sạc vào, có loại cổng tyc vừa sạc vào vừa sạc ra).



Phân loại theo dung lượng :

-Sạc dự phòng 10.000mAh : khả năng sạc khoảng 1,5 đến 2 lần sạc.

-Sạc dự phòng 20.000mAh : khả năng sạc khoảng 3,5 đến 4 lần sạc.

-Sạc dự phòng 60.000mAh : khả năng sạc khoảng 10 đến 15 lần sạc, sạc được cả cho laptop.



Phân loại theo tính năng:

-Sạc dự phòng không dây : sạc bằng cách đặt điện thoại lên pin, không cần cấm dây, tiện lợi gọn gàng ,phù hợp máy có hổ trợ sạc không dây. Tuy nhiên tốc độ sạc chậm hơn sạc dây, khi sạc máy sẽ có tình trạng hơi nóng máy.



-Sạc dự phòng có hổ trợ kèm dây: dây sạc gắn sẵn (TypeC, lighning,micro), tiện lợi không cần mang theo dây rời.



-Sạc dự phòng vừa là pin sạc vừa là cốc sạc: cấm điện thì hoạt động như cốc sạc, rút điện ra thì dùng như sạc dự phòng, 2 trong 1 tiết kiệm chi phí gọn gàng hành lí khi đi xa. Tuy nhiên dung lượng thường không quá cao, công suất sạc thấp hơn cóc sạc chuyên dụng.



CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1. Khi sạc dự phòng hết pin sạc bao lâu đầy em?

-Đối với dung lượng 10.000mAh dùng cốc sạc nhanh khoảng 3 đến 4 tiếng.

-Đối với dung lượng 20.000mAh dùng cốc sạc nhanh khoảng 5 đến 6 tiếng.

Dung lượng càng lớn thời gian sạc đầy càng lâu ạ.

2.Dùng sạc dự phòng thường xuyên có ảnh hưởng gì đến máy không em ?

-Dạ không ạ,vì sạc dự phòng có chip tự điều chỉnh dòng điện,nên máy chỉ nhận đúng mức cần thiết,hạn chế làm chai pin, sạc nhanh vẫn an toàn hơn cấm điện trực tiếp vào ổ điện ạ.

3. Tại sao pin dự phòng không đủ 100% như thông số?

- Dạ do hiệu suất chuyển đổi của pin dự phòng theo thời gian sẽ bị hao hụt dần theo thời gian nên dung lượng thật của pin sẽ giao động từ 60-70% ạ.

4. Sạc dự phòng loại nào thì đem lên máy bay được vậy em ?

-Dung lượng dưới 30.000mAh và chỉ số tốc độ xả 3C được kí hiệu trên sạc dự phòng.

5. Sạc dự phòng mới mua có cần sạc đủ 8 tiếng không ?

-Dạ không cần đâu ạ, Pin hiện nay là pin thông minh, sạc đầy là dùng được ngay. Trường hợp mới khui thì thường chỉ số pin là ảo nên cần sạc lại trước khi sử dụng ạ.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        10, 
        'Kiến Thức Về Jack Chuyển Đổi , Cáp OTG', 
        '- Jack chuyển đổi dùng để chuyển đổi cổng kết nối và truyền tải dữ liệu.

- Có các loại như :

. Cổng TypeC hoặc Lighting sang 3.5mm : Dùng cho điện thoại không có cổng 3.5mm để sử dụng tai nghe.

. Cổng TypeC hoặc Lighting sang USB : Dùng để sử dụng chuột, bàn phím và USB,...

. Cổng HDMI sang UGA hoặc TypeC sang HDMI : Dùng để kết nối Laptop điện thoại với Tivi hoặc máy chiếu ...

CHẾ ĐỘ BẢO HÀNH

- Bảo hành Jack Chuyển Đổi: Bảo hành 8 tháng. Trường hợp jack không hoạt động, không kết nối được, hoặc kết nối chập chờn. Không hỗ trợ trường hợp hư hỏng do đứt gãy, sản phẩm bị biến dạng.

CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1.Jack chuyển đổi có làm giảm chất lượng âm thanh không?

-Nếu là jack có chip giải mã (DAC) thì âm thanh ổn định, gần như không khác tai nghe cấm trực tiếp.

-Jack không chip có thể bị nhỏ tiếng hoặc không tương thích một số máy.

2.Jack này có vừa nghe nhạc vừa sạc được không ?

-Jack thường chỉ nghe nhạc

-Jack 2 trong 1 : có cổng sạc và cổng tai nghe sẽ vừa sạc vừa nghe nhạc tuy nhiên sạc sẽ chậm hơn sạc trực tiếp.

3.Jack chuyển đổi dùng được cho gọi điện không?

-Đối với loại jack có hổ trợ mic.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        11, 
        'Kiến Thức Về Thẻ Nhớ Và Usb', 
        '-Thẻ nhớ và usb là thiết bị lưu trữ dữ liệu (hình ảnh, video, file...) thường dùng cho điện thoại, camera máy ảnh, camera hành trình.

-Dung lượng thường gặp : 4GB, 8GB, 16GB, 32GB, 64GB, 128GB, 256GB ...

CHẾ ĐỘ BẢO HÀNH

- Bảo hành Thẻ Nhớ: Bảo hành 8 tháng. Trường hợp không nhận hoặc không kết nối được với thiết bị, không đọc, không ghi được dữ liệu, sai lệch dung lượng so với thông số. Không hỗ trợ trường hợp hư hỏng do gãy, vỡ, biến dạng, thẻ bị ngấm nước.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        12, 
        'Kiến Thức Về Phụ Kiện Ô Tô', 
        '1.Tẩu sạc ô tô: là thiết bị cấm vào cổng tẩu trên xe, dùng để sạc điện thoại, máy tính bảng, camera hành trình, ...

-Các loại tẩu sạc phổ biến:

+Tẩu có cổng usb và cổng type c

+Tẩu có cổng PD/QC (sạc nhanh)

+Tẩu 1 cổng: dùng 1 thiết bị

+Tẩu 2/3 cổng : sạc nhiều thiết bị cùng lúc

-Công suất tẩu sạc :

+12W – 18W : sạc cổng usb (sạc thường)

+20W – 30W – 45W- 65W  : sạc cổng type c (sạc nhanh)

CHẾ ĐỘ BẢO HÀNH

-Bảo hành tẩu sạc: Trường hợp không nhận sạc, sạc chập chờn, tự ngắt sạc khách hàng sẽ được bảo hành đổi mới sản phẩm.Trường hợp hư hỏng do ngấm nước, rơi vỡ, sản phẩm bị biến dạng khách hàng sẽ không được bảo hành.



2.Giá đỡ trên ô tô: là phụ kiện giúp cố định điện thoại trên xe, tiện xem bản đồ, nghe gọi rảnh tay,an toàn khi lái xe.

-Các loại kệ ô tô phổ biến:

+Kệ gắn taplo

+Kệ gắn kính lái

+Kệ gắn cửa gió điều hòa

+Kệ nam châm'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        13, 
        'Kiến Thức Về Phụ Kiện Ipad', 
        '-Bao da ipad:

- Các loại iPad dùng chung :

. iPad mini 1/2/3

. iPad mini 4/5

. iPad mini 6/7

. iPad 9.7” ( 5/6/7/8/9 )

. iPad 10.2”/10.5”

. iPad Gen 10 ( 10.9” )

. iPad Pro11/Air4-5

. iPad Air13/M3

. iPad Air11/M2

. iPad pro M4

-Cường lực ipad :

- Cường lực : 99k / 119k / 239k / 289k / 429k.

- PPF trong và nhám cắt máy iPad : 148k ( dán trước và sau ).

- Bút cảm ứng : 248k / 539k / 699k / 899k.

. Có loại dùng cơ bản để chạm cảm ứng hoặc loại dùng để vẽ thiết kế đồ họa.

. Có loại sạc trực tiếp và loại sạc từ tính trên iPad.

CHẾ ĐỘ BẢO HÀNH : Bảo hành bút cảm ứng 8 tháng. Trường hợp bút không nhận cảm ứng, lỗi cảm biến, không sạc được (nếu có tính năng sạc). Không hỗ trợ trường hợp hư hỏng do ngấm nước, rơi vỡ, đứt gãy, biến dạng sản phẩm.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        14, 
        'Kiến Thức Về Phụ Kiện Apple watch', 
        '- Cường lực : Size 38 - 40 - 41 - 42 -45- 49

- PPF mặt trước : Dạng phôi phục hồi 99k ( 6 lần dán ), Dạng miếng lẻ 39k.

- Dây đeo : Size 38-40-41 dùng chung, size 42-44-45 dùng chung.

CHẾ ĐỘ BẢO HÀNH

- Cường lực Apple Watch bảo hành 45 ngày. Trường hợp bong tróc keo, cảm ứng vuốt không ăn lỗi do kính cường lực bảo hành 100%, trường hợp trầy xước cấn vỡ bảo hành 50%.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        15, 
        'Kiến Thức Về Tai Nghe Bluetooth', 
        'Tai nghe bluetooth là tai nghe kết nối không dây với điện thoại, máy tính bảng, laptop... thông qua bluetooth, không cần cấm dây.

1.Tai nghe bluetooth TWS: hai bên tai rời, có hộp sạc, gọn nhẹ tiện di chuyển,

- Tai nghe dạng Airpods 2 : Tai dài không mút.

- Tai nghe dạng Airpods 3 : Tai ngắn không mút.

- Tai nghe dạng Airpods Pro : Tai ngắn có mút.

- Tai nghe dạng Airpods 4 : Tai nhỏ gọn.

- Tai nghe tích hợp chống ồn ANC.

- Tai nghe có các mức giá từ : 299k, 399k, 499k, 599k, 699k, 720k,....

2.Tai nghe chụp tai: chụp toàn bộ hoặc vành tai, âm thanh lớn, pin lâu,phù hợp học tập , làm việc, giải trí lâu.

CHẾ ĐỘ BẢO HÀNH TAI NGHE BLUETOOTH

- Bảo hành 8 tháng.

- Trường hợp lỗi do không kết nối được Bluetooth, mất âm thanh, nghe bị rè, lỗi pin (sạc không vào, không giữ pin). Không bảo hành rơi vỡ, va đập, trầy xước nhiều, vào nước và các tác động từ bên ngoài.

CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1.Giá thấp với giá cao khác nhau chỗ nào em? - Khác nhau về chất lượng âm thanh - tuổi thọ của pin - chức năng cách âm và các tính năng hỗ trợ người dùng đa dạng hơn.

2.Không có loại rẻ hơn nữa hả?. Thấy trên mạng rẻ lắm mà ?- Dạ trên thị trường sẽ có rất nhiều mẫu mã và các mức giá khác nhau,tuy nhiên để đảm bảo chất lượng sản phẩm shop chỉ phân phối tai nghe từ phân khúc giá này thôi ạ . Và khi mua trên mạng sẽ không kiểm chứng được chất lượng sản phẩm , khi lỗi bảo hành sẽ khó khăn hơn . hàng bên em thì mình được nghe thư thoải mái , bảo hành 8 tháng lỗi là đổi mới ạ.

3.Tai nghe Bluetooth sài xuyên suốt được mấy tiếng ? - Tùy vào loại tai nghe , âm lượng & ứng dụng sẽ có dung lượng pin khác nhau ạ.tuy nhiên khoảng từ 3-4 tiếng với tai nghe thường . 6- 8 tiếng với hàng cao cấp ạ.

4.Tai nghe Bluetooth sạc bao lâu thì đầy pin ? - Thông thường khi sạc từ 0% đến 100% sẽ mất khoảng 2 -3 tiếng. nhưng hạn chế để cạn pin mới sạc thì dễ bị chai pin.5.Pin để không sài đến có hết pin không ?

- Dạ có ạ, do pin sẽ có mức tự xả năng lượng nên khi để lâu không sử dụng vẫn sẽ bị hết pin theo thời gian. Ngoài ra, cũng sẽ ảnh hưởng đến tuổi thọ của pin.

6. Kết nối dễ không em ?

- Dạ dễ ạ, chỉ cần mở nắp hộp bật bluetooth lên kết nối 1 lần với máy điện thoại sẽ tự động kết nối vào những lần sau ạ. Nếu muốn kết nối với máy khác chỉ cần : Reset lại tai nghe hoặc ngắt kết nối với máy cũ và kết nối lại với máy mới.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        16, 
        'Kiến Thức Về Tai Nghe Có Dây', 
        '-Tai nghe có dây : là loại tai nghe kết nối trực tiếp với thiết bị bằng dây cáp như jack 3.5mm, type c và lingtning, không cần pin không cần sạc. Âm thanh ổn định không bị trể không nhiễu sóng.

+Một số tai nghe linghning thường có dây vẫn phải kết nối bluetooth do iphone là thiết bị có bảo mật cao.

+Có mic dùng nghe gọi,

+Có nút điều khiển âm lượng : tăng/giảm âm lượng,dừng/phát nhạc.

CHẾ ĐỘ BẢO HÀNH TAI NGHE DÂY

-Bảo hành 8 tháng. Trường hợp lỗi do nhà sản xuất, mất âm thanh một bên hoặc cá hai bên, nghe bị rè. Không áp dụng bảo hành hư hỏng do ngấm nước, rơi vỡ, va đập, đứt gãy.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        17, 
        'Kiến Thức Về Loa Bluetooth Và Mic Karaoke', 
        '-Loa bluetooth là loa kết nối không dây với điện thoại máy tính,laptop thông qua bluetooth để phát nhạc, xem phim, hát karaoke...

- Kích thước nhỏ, vừa, lớn và có loại sẽ có đèn chuyển động theo nhịp nhạc.

- Công xuất từ 5 – 10W: nghe cá nhân, phòng nhỏ

- Công xuất từ 10 – 20W : phòng vừa, nhóm nhỏ

- Công xuất từ 30W trở lên : tiệc, ngoài trời.

- Thời gian sử dụng và thời gian sạc sẽ tùy thuộc vào từng mẫu loa khác nhau.

- Có các thương hiệu như : Hoco, Wiwu, Remax, …

- Giá giao động từ : 300k trở lên

CHẾ ĐỘ BẢO HÀNH

-Bảo hành 8 tháng, lỗi không kết nối được bluetooth, mất âm thanh, nghe bị rè, sạc không vào không cầm pin,mic không hoạt động. Không bảo hành hư hỏng do rơi vỡ, va đập, vào nước.

CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1. Loa Bluetooth có kháng nước kháng bụi không em ?

- Dạ loa đều có 1 lớp kháng nước và kháng bụi ạ, tuy nhiên khi để ở môi người nước ẩm thấp hoặc quá bụi bẩn quá nhiều sẽ ảnh hưởng đến lớp bảo vệ của loa dẫn đến tình trạng rè hoặc bám bẩn trên loa ạ.

2. Loa này có kết nối được với máy tính không ?

- Dạ dùng được ạ, chỉ cần máy tính có chức năng kết nối Bluetooth là được.

3. Sạc bằng pin dự phòng được không?

- Dạ được ạ.

4. Để cạn pin rồi sạc có ảnh hưởng gì không?

- Nếu để cạn pin mới sạc sẽ dễ ảnh hưởng đến tuổi thọ của pin và thời gian sử dụng sẽ bị giảm dần. Vậy nên khi có âm thanh báo hiệu sắp hết pin anh/chị nên sạc ạ.

5. Sạc loa qua đêm có sao không?

- Dạ nếu để sạc qua đêm sẽ gây hại về tuổi tho của pin và thời gian sử dụng sẽ bị suy giảm ạ.

6. Vừa sạc vừa mở nghe/ hát có ảnh hưởng gì không?

- Dạ việc này sẽ ảnh hưởng đế pin và nguồn sạc dễ bị hư ạ.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        18, 
        'Dịch Vụ Sữa Chữa', 
        'CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

1. Sao màn hình bảo hành ít vậy em?

- Dạ vì đây là màn hình do người dùng sử dụng trực tiếp tác động nên sẽ không được bảo hành lâu như những linh kiện khác bên trong máy ạ.

2. Màn zin và màn lô khác nhau gì em?

- Màn hình zin : là màn chính hãng theo máy (hoặc linh kiện chất lượng tương đương linh kiện hãng). Màu sắc chuẩn, độ sáng cao, cảm ứng mượt nhạy, ít hao pin ổn định lâu dài.

- Màn hình lô : là màn hình linh kiện ngoài, màu sắc kém hơn chuẩn, cảm ứng kém mượt, đôi lúc đơ lang, hao pin hơn. Nhưng giá thành rẻ.3. Thay màn xong có sài được vân tay không em?

-Vân tay 50/50 có máy được có máy không.

4. Sửa chữa có bị mất dữ liệu máy không em?

- Dạ không ạ, chỉ là thay thế linh kiện khác vào máy không mấy dữ liệu ạ.

5. Thay xong bị lại nếu hết bảo hành thì phải thay tiếp hả em?

- Dạ nếu máy của anh/chị có sửa chữa bên em thì em sẽ nhận lại kiểm tra và sẽ hỗ trợ cho mình về giá hoặc sửa chữa giúp anh/chị nếu có thể khắc phục được lỗi ạ.6. Sao thấy lâu vậy em?

- Dạ thay sửa sẽ qua rất nhiều công đoạn và khi thay xong phải test máy lại kiểm tra cho khách rồi mới giao máy được ạ. Thời gian trung bình là khoảng 1-2 tiếng từ khi nhận máy ạ.

7. Xin mật khẩu làm gì em?

- Dạ xin mật khẩu để khi chuẩn bị ráp máy hoàn thành thì sẽ kiểm tra toàn bộ lại máy cho mình ạ. Nếu anh/chị không cho em mật khẩu thì em sẽ không chịu trách nhiệm về các chức năng khác của máy nếu có phát sinh lỗi hỏng ạ .

8. Bảo hành lưu bằng gì? Có giữ giấy gì không?

- Dạ khi sửa chữa máy hoặc mua linh kiện bên em sẽ được lưu bảo hành trên số điện thoại mà anh chị thường mua hàng hoặc số điện thoại đang sử dụng để khi có lỗi về sản phẩm thì anh chị cứ ra cửa hàng và đọc lại số điện thoại đã được lưu từ trước để các bạn nhân viên bảo hành lại cho anh chị ạ.

9.Pin EU và pin Pisen khác nhau chổ nào ?

- Pin Eu : pin tiêu chuẩn theo máy, có loại dung lượng chuẩn có loại dung lượng cao, giá thành thấp hơn.

-Pin Pisen : pin thương hiệu lớn, uy tín , độ an toàn cao,ổn định ít chai pin, có bảo hiểm cháy nổ lên đến 46 tỷ'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        19, 
        'Thực Hành: Quy Trình Bán Hàng 6 Bước PK88', 
        'Áp dụng quy trình 6 bước:

1. Chào đón khách hàng bằng nụ cười và sự niềm nở.
2. Tìm hiểu nhu cầu thực tế của khách.
3. Tư vấn giải pháp phù hợp nhất (Không phải đắt nhất).
4. Chốt Sale và Cross-sell (Bán chéo thêm cáp, sạc, ốp).
5. Thanh toán, lấy SĐT lưu thông tin bảo hành.
6. Tiễn khách.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        20, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 20)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        21, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 21)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        22, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 22)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        23, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 23)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        24, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 24)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        25, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 25)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        26, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 26)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        27, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 27)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        28, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 28)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        29, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 29)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        30, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 30)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        31, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 31)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        32, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 32)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        33, 
        'Thực Hành Bán Hàng Trực Tiếp (Kỹ năng ngày 33)', 
        '- Thực hành đứng quầy tư vấn dưới sự giám sát của quản lý.
- Luyện tập kỹ năng xử lý từ chối của khách hàng.
- Học cách Upsell sản phẩm dựa trên nhu cầu thực tế của khách.
- Chăm sóc khách hàng sau bán hàng và xử lý khiếu nại cơ bản.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        34, 
        'Kỹ Thuật: Nhận Diện Lỗi & Kiểm Tra Thiết Bị Cơ Bản', 
        'Bước đầu của một Kỹ thuật viên / Sales đa năng:

- Cách phân biệt màn hình zin và màn hình lô (linh kiện ngoài).
- Cách kiểm tra độ chai pin của iPhone và Android.
- Lệnh test phần cứng (Cảm ứng, Mic, Loa, Camera) trên các dòng máy phổ biến.
- Hướng dẫn khách hàng quét mã QR Code để tra cứu tiến độ sửa chữa.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        35, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 35)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        36, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 36)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        37, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 37)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        38, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 38)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        39, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 39)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        40, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 40)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        41, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 41)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        42, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 42)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        43, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 43)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        44, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 44)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        45, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 45)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        46, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 46)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        47, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 47)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        48, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 48)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        49, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 49)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        50, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 50)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        51, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 51)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        52, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 52)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        53, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 53)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        54, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 54)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        55, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 55)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        56, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 56)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        57, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 57)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        58, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 58)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        59, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 59)', 
        '- Luyện tập kỹ thuật lắp đặt phụ kiện (Dán kính cường lực, cắt và dán PPF).
- Cài đặt phần mềm cơ bản cho khách.
- Quy trình tiếp nhận máy sửa chữa và tạo Phiếu biên nhận điện tử.
- Bảo mật dữ liệu và tôn trọng quyền riêng tư của khách hàng.'
    );

    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 
        60, 
        'Đào Tạo Kỹ Thuật Chuyên Sâu (Ngày 60)', 
        'BÀI KIỂM TRA ĐÁNH GIÁ CUỐI KỲ THỬ VIỆC

- Đánh giá kiến thức sản phẩm.
- Đánh giá kỹ năng bán hàng.
- Đánh giá thái độ phục vụ.
- Kết quả: Đạt sẽ được ký Hợp đồng chính thức.'
    );

END $$;
