window.V4Lesson = {
  "id": "cpp-v4-bai02",
  "version": "20261115-1",
  "title": "Bài 2 · Biến và câu lệnh cin",
  "subtitle": "Phân tích bài toán rồi chuyển thành Code C++",
  "kud": {
    "know": [
      {
        "id": "K1",
        "vi": "Khái niệm Input, Output, biến và kiểu int; dữ liệu thay đổi và dữ kiện đã biết.",
        "en": "Input, Output, variables and the int type; changing data and given constants."
      },
      {
        "id": "K2",
        "vi": "Cú pháp khai báo, phép gán, cin, cout và các phép tính số học với số nguyên trong phạm vi bài.",
        "en": "Declaration, assignment, cin, cout and integer arithmetic within the scope of the lesson."
      },
      {
        "id": "K3",
        "vi": "Thứ tự Input, xử lý, Output; cấu tạo của một test case gồm Input và Output mong đợi.",
        "en": "The order of input, processing and output; a test case consists of Input and expected Output."
      }
    ],
    "understand": [
      {
        "id": "U1",
        "vi": "Học sinh hiểu được rằng thứ tự xử lý quyết định giá trị được lưu và kết quả được xuất; thay đổi dữ liệu không tự cập nhật kết quả đã tính từ dữ liệu đó.",
        "en": "Students will understand that processing order determines stored values and results; changing data does not automatically update a result previously calculated from that data."
      },
      {
        "id": "U2",
        "vi": "Học sinh hiểu được rằng tách dữ liệu vào khỏi quy tắc xử lý cho phép dùng lại cùng một cách giải với nhiều bộ dữ liệu và kiểm chứng bằng kết quả dự kiến.",
        "en": "Students will understand that separating input data from processing rules allows the same solution to be reused with different data and checked against predicted results."
      }
    ],
    "do": [
      {
        "id": "D1",
        "vi": "Xác định Input, Output và dữ kiện đã biết của một đề mới.",
        "en": "Identify Input, Output and given constants in a new problem."
      },
      {
        "id": "D2",
        "vi": "Viết hoặc sắp xếp thuật toán bằng lời, giải thích thứ tự và chạy tay với một test case.",
        "en": "Write or arrange an algorithm in words, explain its order and trace one test case."
      },
      {
        "id": "D3",
        "vi": "Chuyển thuật toán sang Code C++, dùng biến, phép gán, cin và cout đúng mục đích.",
        "en": "Translate an algorithm into C++ using variables, assignment, cin and cout appropriately."
      },
      {
        "id": "D4",
        "vi": "Dự kiến Output, Run, đối chiếu test case và sửa một lỗi về thứ tự hoặc phép tính.",
        "en": "Predict Output, Run the program, compare test cases and correct an ordering or arithmetic error."
      }
    ],
    "concepts": [
      {
        "name": "Thứ tự / Sequence",
        "question": "Đổi thứ tự nhập và tính có thể làm kết quả thay đổi như thế nào?"
      },
      {
        "name": "Trạng thái / State",
        "question": "Vì sao sửa một biến chưa làm kết quả đã lưu tự thay đổi?"
      },
      {
        "name": "Khái quát hóa / Generalization",
        "question": "Cần tách dữ liệu và quy tắc ra sao để một chương trình dùng lại được?"
      }
    ],
    "scaffolding": [
      {
        "kind": "Factual",
        "q": "Trong bài quầy nước, số nào do người mua nhập và số nào đã biết?",
        "evidence": "Phân biệt số ly với đơn giá."
      },
      {
        "kind": "Factual",
        "q": "Biến tổng đang lưu giá trị nào ngay sau phép gán?",
        "evidence": "Theo dõi giá trị hiện tại."
      },
      {
        "kind": "Conceptual",
        "q": "Hai người mua số ly khác nhau nhưng dùng cùng chương trình được vì sao?",
        "evidence": "Nối dữ liệu thay đổi với quy tắc cố định."
      },
      {
        "kind": "Conceptual",
        "q": "Vì sao kết quả đã tính chưa đổi khi số ly đổi?",
        "evidence": "Giải thích bằng thứ tự thực hiện và giá trị được lưu."
      },
      {
        "kind": "Debatable",
        "q": "Chỉ Run đúng một lần đã đủ tin chương trình đúng chưa? Hãy dùng ví dụ để bảo vệ ý kiến.",
        "evidence": "Nêu được giới hạn của một test case và đề xuất Input khác."
      }
    ]
  },
  "tasks": [
    {
      "id": "nuoc",
      "title": "Quầy nước",
      "level": "Làm mẫu và cùng làm",
      "session": 1,
      "program": "P05",
      "statement": "Quầy nước bán mỗi ly 20000 đồng. Nhập số ly cần mua từ 1 đến 100. Tính và xuất tổng tiền phải trả, đơn vị đồng.",
      "inputMode": "select",
      "outputMode": "select",
      "inputOptions": [
        [
          "quantity",
          "Số ly cần mua"
        ],
        [
          "price",
          "Đơn giá 20000 đồng đã biết"
        ],
        [
          "total",
          "Tổng tiền phải trả"
        ]
      ],
      "inputAnswer": "quantity",
      "outputOptions": [
        [
          "quantity",
          "Số ly cần mua"
        ],
        [
          "total",
          "Tổng tiền phải trả, đơn vị đồng"
        ],
        [
          "price",
          "Đơn giá mỗi ly"
        ]
      ],
      "outputAnswer": "total",
      "algorithmMode": "cards",
      "steps": [
        [
          "read",
          "Nhập số ly cần mua."
        ],
        [
          "compute",
          "Tính tổng tiền bằng số ly nhân 20000."
        ],
        [
          "print",
          "Xuất tổng tiền, đơn vị đồng."
        ]
      ],
      "dependencies": [
        [
          "read",
          "compute"
        ],
        [
          "compute",
          "print"
        ]
      ],
      "starter": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int soLy;\n    cout << \"Nhap so ly: \";\n    cin >> soLy;\n    // Tính và xuất tổng tiền từ thuật toán của em.\n    return 0;\n}\n",
      "prompts": [
        "Nhap so ly: "
      ],
      "inputLabels": [
        "Số ly"
      ],
      "inputDomains": [
        {
          "min": 1,
          "max": 100
        }
      ],
      "tests": [
        {
          "input": "1",
          "value": 20000,
          "id": "nuoc-1",
          "expectedStdout": "Nhap so ly: Tong tien: 20000 dong\n",
          "expectedScreen": "Nhap so ly: 1\nTong tien: 20000 dong\n"
        },
        {
          "input": "3",
          "value": 60000,
          "id": "nuoc-2",
          "expectedStdout": "Nhap so ly: Tong tien: 60000 dong\n",
          "expectedScreen": "Nhap so ly: 3\nTong tien: 60000 dong\n"
        },
        {
          "input": "5",
          "value": 100000,
          "id": "nuoc-3",
          "expectedStdout": "Nhap so ly: Tong tien: 100000 dong\n",
          "expectedScreen": "Nhap so ly: 5\nTong tien: 100000 dong\n"
        }
      ],
      "outputLabel": "Tong tien: ",
      "outputUnit": " dong",
      "why": "Vì sao cần nhập số ly trước khi tính tổng tiền?",
      "hints": {
        "ipo": "Số nào thay đổi theo mỗi người mua? Đơn giá đã được đề cho biết.",
        "algorithm": "Muốn tính tổng tiền, cần biết số ly trước. Sau khi có tổng mới xuất kết quả.",
        "code": "Đối chiếu bước tính trong thuật toán với phép nhân và phép gán; sau đó xuất biến đang lưu tổng tiền."
      }
    },
    {
      "id": "ve",
      "title": "Quầy vé",
      "level": "Luyện có hỗ trợ",
      "session": 2,
      "program": "P06",
      "statement": "Vé người lớn giá 90000 đồng, vé trẻ em giá 60000 đồng. Nhập lần lượt số vé người lớn và số vé trẻ em; mỗi số từ 0 đến 50. Tính tổng tiền khách phải trả, đơn vị đồng.",
      "inputMode": "select",
      "outputMode": "text",
      "inputOptions": [
        [
          "both",
          "Số vé người lớn và số vé trẻ em"
        ],
        [
          "prices",
          "Hai mức giá đã biết"
        ],
        [
          "total",
          "Tổng tiền khách phải trả"
        ]
      ],
      "inputAnswer": "both",
      "algorithmMode": "completion",
      "steps": [
        [
          "adult",
          "Nhập số vé người lớn."
        ],
        [
          "child",
          "Nhập số vé trẻ em."
        ],
        [
          "compute",
          ""
        ],
        [
          "print",
          "Xuất tổng tiền, đơn vị đồng."
        ]
      ],
      "dependencies": [
        [
          "adult",
          "child"
        ],
        [
          "child",
          "compute"
        ],
        [
          "compute",
          "print"
        ]
      ],
      "starter": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết Code C++ từ thuật toán của em tại đây.\n    return 0;\n}\n",
      "prompts": [
        "Nhap so ve nguoi lon: ",
        "Nhap so ve tre em: "
      ],
      "inputLabels": [
        "Số vé người lớn",
        "Số vé trẻ em"
      ],
      "inputDomains": [
        {
          "min": 0,
          "max": 50
        },
        {
          "min": 0,
          "max": 50
        }
      ],
      "tests": [
        {
          "input": "1\n0",
          "value": 90000,
          "id": "ve-1",
          "expectedStdout": "Nhap so ve nguoi lon: Nhap so ve tre em: Tong tien: 90000 dong\n",
          "expectedScreen": "Nhap so ve nguoi lon: 1\nNhap so ve tre em: 0\nTong tien: 90000 dong\n"
        },
        {
          "input": "0\n2",
          "value": 120000,
          "id": "ve-2",
          "expectedStdout": "Nhap so ve nguoi lon: Nhap so ve tre em: Tong tien: 120000 dong\n",
          "expectedScreen": "Nhap so ve nguoi lon: 0\nNhap so ve tre em: 2\nTong tien: 120000 dong\n"
        },
        {
          "input": "2\n3",
          "value": 360000,
          "id": "ve-3",
          "expectedStdout": "Nhap so ve nguoi lon: Nhap so ve tre em: Tong tien: 360000 dong\n",
          "expectedScreen": "Nhap so ve nguoi lon: 2\nNhap so ve tre em: 3\nTong tien: 360000 dong\n"
        },
        {
          "input": "0\n0",
          "value": 0,
          "id": "ve-4",
          "expectedStdout": "Nhap so ve nguoi lon: Nhap so ve tre em: Tong tien: 0 dong\n",
          "expectedScreen": "Nhap so ve nguoi lon: 0\nNhap so ve tre em: 0\nTong tien: 0 dong\n"
        }
      ],
      "outputLabel": "Tong tien: ",
      "outputUnit": " dong",
      "why": "Tổng tiền phải gồm những khoản nào? Chọn một test case để kiểm tra điều đó.",
      "hints": {
        "ipo": "Giá từng loại đã biết; người mua cần cho biết số lượng của cả hai loại.",
        "algorithm": "Tính riêng tiền từng loại vé rồi cộng hai khoản. Viết bước đó bằng lời của em.",
        "code": "Mỗi dữ liệu cần có biến và cin riêng. Dùng thuật toán của em để quyết định các phép tính."
      }
    },
    {
      "id": "quy",
      "title": "Quỹ lớp",
      "level": "Tự làm",
      "session": 2,
      "program": "P07",
      "statement": "Mỗi bạn trong lớp góp cùng một số tiền vào quỹ. Nhập lần lượt số bạn từ 1 đến 50 và số tiền mỗi bạn góp từ 0 đến 100000 đồng. Tính tổng quỹ, đơn vị đồng. Chương trình cần dùng lại được cho lớp khác mà không sửa code.",
      "inputMode": "text",
      "outputMode": "text",
      "algorithmMode": "text",
      "steps": [],
      "dependencies": [],
      "starter": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết Code C++ từ thuật toán của em tại đây.\n    return 0;\n}\n",
      "prompts": [
        "Nhap so ban: ",
        "Nhap tien moi ban: "
      ],
      "inputLabels": [
        "Số bạn",
        "Số tiền mỗi bạn góp"
      ],
      "inputDomains": [
        {
          "min": 1,
          "max": 50
        },
        {
          "min": 0,
          "max": 100000
        }
      ],
      "tests": [
        {
          "input": "30\n10000",
          "value": 300000,
          "id": "quy-1",
          "expectedStdout": "Nhap so ban: Nhap tien moi ban: Tong quy: 300000 dong\n",
          "expectedScreen": "Nhap so ban: 30\nNhap tien moi ban: 10000\nTong quy: 300000 dong\n"
        },
        {
          "input": "25\n15000",
          "value": 375000,
          "id": "quy-2",
          "expectedStdout": "Nhap so ban: Nhap tien moi ban: Tong quy: 375000 dong\n",
          "expectedScreen": "Nhap so ban: 25\nNhap tien moi ban: 15000\nTong quy: 375000 dong\n"
        },
        {
          "input": "1\n0",
          "value": 0,
          "id": "quy-3",
          "expectedStdout": "Nhap so ban: Nhap tien moi ban: Tong quy: 0 dong\n",
          "expectedScreen": "Nhap so ban: 1\nNhap tien moi ban: 0\nTong quy: 0 dong\n"
        },
        {
          "input": "50\n100000",
          "value": 5000000,
          "id": "quy-4",
          "expectedStdout": "Nhap so ban: Nhap tien moi ban: Tong quy: 5000000 dong\n",
          "expectedScreen": "Nhap so ban: 50\nNhap tien moi ban: 100000\nTong quy: 5000000 dong\n"
        }
      ],
      "outputLabel": "Tong quy: ",
      "outputUnit": " dong",
      "why": "Vì sao chương trình của em dùng lại được cho lớp khác?",
      "hints": {
        "ipo": "Thông tin nào của lớp khác có thể thay đổi? Kết quả cuối cùng cần có đơn vị gì?",
        "algorithm": "Giải bằng tay cho một lớp nhỏ, rồi ghi lại các việc vừa làm theo thứ tự.",
        "code": "Chỉ ra từng bước thuật toán và đoạn Code C++ thực hiện bước đó. Tra phần cú pháp đang cần trong Ghi bài."
      }
    }
  ],
  "notes": [
    {
      "id": "bien",
      "title": "Biến và khai báo",
      "purpose": "Giữ một giá trị để chương trình dùng trong các bước tiếp theo.",
      "rule": "Trong bài này, int lưu số nguyên. Khai báo đặt tên và kiểu cho biến; ví dụ gán ngay giá trị ban đầu là 3.",
      "program": "P01",
      "syntaxLines": [
        5
      ],
      "remember": "Tên biến và giá trị đang lưu là hai thông tin khác nhau."
    },
    {
      "id": "gan",
      "title": "Phép gán và thứ tự",
      "purpose": "Lưu giá trị mới vào biến.",
      "rule": "Dấu = lưu kết quả ở vế phải vào biến ở vế trái. Kết quả đã tính được giữ nguyên cho đến khi chương trình cập nhật nó.",
      "program": "P02",
      "syntaxLines": [
        5,
        6,
        7
      ],
      "remember": "Muốn tổng tiền theo số ly mới, cần tính lại tổng tiền.",
      "compareProgram": "P03"
    },
    {
      "id": "cout",
      "title": "Output với cout",
      "purpose": "Xuất chữ hoặc giá trị ra Terminal.",
      "rule": "Nội dung trong dấu ngoặc kép được xuất thành chữ. Tên biến ngoài dấu ngoặc kép cho giá trị đang lưu. endl xuống dòng.",
      "program": "P04",
      "syntaxLines": [
        6,
        7
      ],
      "remember": "Trong ví dụ, dòng đầu là chữ soLy; dòng sau là giá trị 3."
    },
    {
      "id": "cin",
      "title": "Input với cin",
      "purpose": "Nhận dữ liệu để cùng chương trình dùng được nhiều lần.",
      "rule": "Khai báo biến trước khi nhập. Dùng cout để hỏi, cin nhận Input vào biến, rồi mới tính và xuất kết quả.",
      "program": "P05",
      "syntaxLines": [
        5,
        6,
        7
      ],
      "remember": "Bấm Run, nhập tại mũi tên trong Terminal và nhấn Enter."
    },
    {
      "id": "pheptinh",
      "title": "Các phép tính số nguyên",
      "purpose": "Diễn đạt bước xử lý của thuật toán.",
      "rule": "Có phép cộng, trừ, nhân, chia nguyên và lấy phần dư. Ví dụ dùng a có giá trị 17, b có giá trị 5; 17 chia 5 có thương nguyên 3 và phần dư 2.",
      "program": "P09",
      "syntaxLines": [
        7,
        8,
        9,
        10,
        11
      ],
      "remember": "Chọn phép tính theo ý nghĩa bài toán; dùng ngoặc khi cần làm rõ thứ tự."
    }
  ],
  "vocabulary": [
    "Input",
    "Output",
    "Thuật toán",
    "Code C++",
    "Khung code",
    "Run",
    "Dừng",
    "Terminal",
    "test case",
    "Output mong đợi",
    "Output thực tế",
    "Kiểm tra",
    "Chạy tay",
    "Gợi ý"
  ],
  "sessions": [
    {
      "n": 1,
      "title": "Biến, phép gán và một Input",
      "activities": [
        [
          "Khởi động chiếc hộp nhớ số",
          5
        ],
        [
          "Làm mẫu biến, phép gán và Output",
          12
        ],
        [
          "Phân tích quầy nước trên giấy",
          10
        ],
        [
          "Sắp xếp thuật toán, dự kiến một test case",
          8
        ],
        [
          "Chuyển sang Code C++ và Run",
          18
        ],
        [
          "Giải thích, chốt ghi bài",
          7
        ]
      ]
    },
    {
      "n": 2,
      "title": "Hai Input và bài tự làm",
      "activities": [
        [
          "Nhớ lại, phân tích lỗi thứ tự",
          5
        ],
        [
          "Cùng phân tích quầy vé",
          10
        ],
        [
          "Tự bổ sung thuật toán và viết Code C++",
          15
        ],
        [
          "Quỹ lớp: phân tích và thuật toán trên giấy",
          10
        ],
        [
          "Quỹ lớp: Code C++, Run và test case",
          15
        ],
        [
          "Giải thích khả năng dùng lại, chốt",
          5
        ]
      ]
    }
  ]
};
