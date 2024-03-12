import { ENDPOINT, LIMIT } from "./const.js";

const studentsRow = document.querySelector(".student-cards");
const searchInput = document.querySelector(".search-input");
const filterSelect = document.querySelector(".student-select");
const pagination = document.querySelector(".pagination");
const workSelect = document.querySelector(".work-select");
const studentForm = document.querySelector(".student-form");
const studentModal = document.querySelector("#student");

const query = new URLSearchParams(location.search);
let teacherId = query.get("id") || +localStorage.getItem("teacherId");
localStorage.setItem("teacherId", teacherId);

console.log(teacherId);

let search = "";
let activePage = 1;
let filter = "";
let isWork = "";
let selected = null;

function getStudentRow({
  firstName,
  lastName,
  phoneNumber,
  avatar,
  email,
  field,
  isWork,
  id,
}) {
  return `
            <div class="student-card">
                <div class="image-content">
                    <span class="overlay"></span>
                    <div class="card-image">
                        <img src=${avatar} alt="" class="card-img">
                    </div>
                </div>
                <div class="card-content">
                    <h2 class="name">${firstName} ${lastName}</h2>
                    <p class="info">
                        <b>Email:</b> <br/> ${email}
                    </p>
                    <p class="info">
                        <b>Phone:</b> ${phoneNumber}
                    </p>
                    <p class="info">
                        <b>Is working:</b> - ${isWork ? "Yes" : "No"}
                    </p>
                    <p class="info">
                        <b>Field:</b> ${field}
                    </p>
                    <div class="buttons">
                        <button studentId="${id}" data-bs-toggle="modal"
                        data-bs-target="#student" class="edit-student-btn">Edit</button>
                        <button studentId="${id}" class="delete-student-btn">Delete</button>
                    </div>
                </div>
            </div>
        `;
}

async function getStudents() {
  studentsRow.innerHTML = "Loading...";

  try {
    const [filterField, order] = filter.split("-");

    const params = {
      firstName: search,
      page: activePage,
      limit: LIMIT,
      sortBy: filterField,
      order,
      isWork,
    };

    let query = new URLSearchParams(params);

    history.pushState({}, "", `students.html?${query}`);

    // const {data:students} = await axios.get(`${ENDPOINT}student` , {params})

    // const {data:allStudents} = await axios.get(`${ENDPOINT}student` , {params:{search}})

    const p1 = await axios.get(`${ENDPOINT}teachers/${teacherId}/students`, {
      params,
    });

    const p2 = await axios.get(`${ENDPOINT}teachers/${teacherId}/students`, {
      params: { search, isWork },
    });

    let students, allStudents;

    [{ data: students }, { data: allStudents }] = await Promise.all([p1, p2]);

    const pages = Math.ceil(allStudents.length / LIMIT);

    if (pages > 1) {
      pagination.innerHTML = `<li class="page-item ${
        activePage === 1 ? "disabled" : ""
      }"><button class="page-link">Previous</button></li>`;

      for (let i = 1; i <= pages; i++) {
        pagination.innerHTML += `<li class="page-item ${
          i === activePage ? "active" : ""
        }"><button class="page-link">${i}</button></li>`;
      }

      pagination.innerHTML += `<li class="page-item ${
        activePage === pages ? "disabled" : ""
      }"><button class="page-link">Next</button></li>`;

      const paginationItems = document.querySelectorAll(".page-link");

      paginationItems.forEach((item, i) => {
        if (i === 0) {
          item.addEventListener("click", () => {
            getPage("-");
          });
        } else if (i === paginationItems.length - 1) {
          item.addEventListener("click", () => {
            getPage("+");
          });
        } else {
          item.addEventListener("click", () => {
            getPage(i);
          });
        }
      });

      function getPage(i) {
        if (i === "+") {
          activePage++;
        } else if (i === "-") {
          activePage--;
        } else {
          activePage = i;
        }
        getStudents();
      }
    } else {
      pagination.innerHTML = "";
    }

    studentsRow.innerHTML = "";

    students.map((student) => {
        studentsRow.innerHTML += getTeacherRow(student);
    });

    const editStudentBtns = document.querySelector(".edit-student-btn");
    const deleteStudentBtns = document.querySelector(".delete-student-btn");

    editStudentBtns.forEach((editBtn) => {
      editBtn.addEventListener("click", async function () {
        selected = this.getAttribute("studentId");
        let { data: student } = await axios.get(
          `${ENDPOINT}teachers/${teacherId}/students/${selected}`
        );
        studentForm.elements.firstName.value = student.firstName;
        studentForm.elements.lastName.value = student.lastName;
        studentForm.elements.avatar.value = student.avatar;
        studentForm.elements.phoneNumber.value = student.phoneNumber;
        studentForm.elements.field.value = student.field;
        studentForm.elements.email.value = student.email;
        studentForm.elements.isWork.checked = student.isWork;
      });
    });

    deleteStudentBtns.forEach((deleteBtn) => {
      deleteBtn.addEventListener("click", async function () {
        let check = window.confirm("Do yo want to delete this student?");
        if (check) {
          const studentId = this.getAttribute("studentId");
          await axios.delete(
            `${ENDPOINT}teachers/${teacherId}/students/${studentId}`
          );
          getStudents();
          activePage = 1;
        }
      });
    });
  } catch (err) {
    studentsRow.innerHTML = err?.response?.data;
  }
}

searchInput.addEventListener("keyup", function () {
  search = this.value;
  getStudents();
});

filterSelect.addEventListener("change", function () {
  filter = this.value;
  getStudents();
});

workSelect.addEventListener("change", function () {
  if (this.value === "true") {
    isWork = true;
  } else if ((this.value = "false")) {
    isWork = false;
  } else {
    isWork = "";
  }
  getStudents();
});

studentForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (this.checkValidity()) {
    let student = {
      firstName: this.elements.firstName.value,
      lastName: this.elements.lastName.value,
      avatar: this.elements.avatar.value,
      isWork: this.elements.isWork.checked,
      phoneNumber: this.elements.phoneNumber.value,
      field: this.elements.field.value,
      email: this.elements.email.value,
    };
    if (selected === null) {
      await axios.post(`${ENDPOINT}teachers/${teacherId}/students`, student);
    } else {
      await axios.put(
        `${ENDPOINT}teachers/${teacherId}/students/${selected}`,
        student
      );
    }
    getStudents();
    bootstrap.Modal.getInstance(studentModal).hide();
    this.reset();
  } else {
    this.classList.add("was-validated");
  }

  console.log(student);
});

getStudents();
