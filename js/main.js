import { ENDPOINT, LIMIT } from "./const.js";
const teachersRow = document.querySelector(".teacher-cards");
const searchInput = document.querySelector(".search-input");
const filterSelect = document.querySelector(".teacher-select");
const pagination = document.querySelector(".pagination");
const marrySelect = document.querySelector(".marry-select");
const teacherForm = document.querySelector(".teacher-form");
const teacherModal = document.querySelector("#teacher");

let search = "";
let activePage = 1;
let filter = "";
let isMarried = "";
let selected = null;

function getTeacherRow({
  firstName,
  lastName,
  phoneNumber,
  avatar,
  email,
  groups,
  isMarried,
  id,
}) {
  return `
        <div class="teacher-card">
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
                    <b>Is married:</b> - ${isMarried ? "Yes" : "No"}
                </p>
                <p class="info">
                    <b>Groups:</b> ${
                      groups[0]
                        ? groups.map((el) => el.trim()).join(", ")
                        : "No groups"
                    }
                </p>
                <div class="buttons">
                    <button teacherId="${id}" data-bs-toggle="modal"
                    data-bs-target="#teacher" class="edit-teacher-btn">Edit</button>
                    <button teacherId="${id}" class="delete-teacher-btn">Delete</button>
                    <a href="/students.html?teacherId=${id}" teacherId="${id}" class="see-students-btn">See students</a>
                </div>
            </div>
        </div>
    `;
}

async function getTeachers() {
  teachersRow.innerHTML = "Loading...";

  try {
    const [filterField, order] = filter.split("-");

    const params = {
      firstName: search,
      page: activePage,
      limit: LIMIT,
      sortBy: filterField,
      order,
      isMarried,
    };

    let query = new URLSearchParams(params);

    history.pushState({}, "", `index.html?${query}`);

    // const {data:teachers} = await axios.get(`${ENDPOINT}teachers` , {params})

    // const {data:allTeachers} = await axios.get(`${ENDPOINT}teachers` , {params:{search}})

    const p1 = await axios.get(`${ENDPOINT}teachers`, { params });

    const p2 = await axios.get(`${ENDPOINT}teachers`, {
      params: { search, isMarried },
    });

    let teachers, allTeachers;

    [{ data: teachers }, { data: allTeachers }] = await Promise.all([p1, p2]);

    const pages = Math.ceil(allTeachers.length / LIMIT);

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
        getTeachers();
      }
    } else {
      pagination.innerHTML = "";
    }

    teachersRow.innerHTML = "";

    teachers.map((teacher) => {
      teachersRow.innerHTML += getTeacherRow(teacher);
    });

    const editTeacherBtns = document.querySelectorAll(".edit-teacher-btn");
    const deleteTeacherBtns = document.querySelectorAll(".delete-teacher-btn");

    editTeacherBtns.forEach((editBtn) => {
      editBtn.addEventListener("click", async function () {
        selected = this.getAttribute("teacherId");
        let { data: teacher } = await axios.get(
          `${ENDPOINT}teachers/${selected}`
        );
        teacherForm.elements.firstName.value = teacher.firstName;
        teacherForm.elements.lastName.value = teacher.lastName;
        teacherForm.elements.avatar.value = teacher.avatar;
        teacherForm.elements.groups.value = teacher.groups.join(", ");
        teacherForm.elements.phoneNumber.value = teacher.phoneNumber;
        teacherForm.elements.email.value = teacher.email;
        teacherForm.elements.isMarried.checked = teacher.isMarried;
      });
    });

    deleteTeacherBtns.forEach((deleteBtn) => {
      deleteBtn.addEventListener("click", async function () {
        let check = window.confirm("Do yo want to delete this teacher?");
        if (check) {
          const teacherId = this.getAttribute("teacherId");
          await axios.delete(`${ENDPOINT}teachers/${teacherId}`);
          getTeachers();
          activePage = 1;
        }
      });
    });
  } catch {
    teachersRow.innerHTML = err?.response?.data;
  }
}

getTeachers();

searchInput.addEventListener("keyup", function () {
  search = this.value;
  getTeachers();
});

filterSelect.addEventListener("change", function () {
  filter = this.value;
  getTeachers();
});

marrySelect.addEventListener("change", function () {
  if (this.value === "true") {
    isMarried = true;
  } else if ((this.value = "false")) {
    isMarried = false;
  } else {
    isMarried = "";
  }
  getTeachers();
});

teacherForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (this.checkValidity()) {
    let teacher = {
      firstName: this.elements.firstName.value,
      lastName: this.elements.lastName.value,
      avatar: this.elements.avatar.value,
      isMarried: this.elements.isMarried.checked,
      groups: this.groups.value.split(","),
      phoneNumber: this.elements.phoneNumber.value,
      email: this.elements.email.value,
    };
    if (selected === null) {
      await axios.post(`${ENDPOINT}teachers`, teacher);
    } else {
      await axios.put(`${ENDPOINT}teachers/${selected}`, teacher);
    }
    getTeachers();
    bootstrap.Modal.getInstance(teacherModal).hide();
    this.reset();
  } else {
    this.classList.add("was-validated");
  }

  console.log(teacher);
});
