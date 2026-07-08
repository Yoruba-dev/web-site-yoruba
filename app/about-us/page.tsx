import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";

export const metadata: Metadata = { title: "About Us" };

const team = [
  { name: "Timothy Beck", role: "IT Expert", img: "/assets/images/about-us/team/1.jpg" },
  { name: "Sarah Sanchez", role: "Web Designer", img: "/assets/images/about-us/team/2.jpg" },
  { name: "Edwin Adams", role: "Content Writer", img: "/assets/images/about-us/team/3.jpg" },
  { name: "Anny Adams", role: "Marketing officer", img: "/assets/images/about-us/team/4.jpg" },
];

const counters = [
  { icon: "ion-ios-briefcase-outline", count: "2169", label: "Project Done" },
  { icon: "ion-ios-wineglass-outline", count: "869", label: "Awards Winned" },
  { icon: "ion-ios-lightbulb-outline", count: "689", label: "Hours Worked" },
  { icon: "ion-happy-outline", count: "2169", label: "Happy Customer" },
];

export default function AboutUsPage() {
  return (
    <>
      <Breadcrumb title="About Us" crumbs={[{ label: "About Us" }]} />
      {/* Begin Hiraola's About Us Area */}
      <div className="about-us-area">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-7 d-flex align-items-center">
              <div className="overview-content">
                <h2>
                  Welcome To <span>Hiraola&apos;s</span> Store!
                </h2>
                <p className="short_desc">
                  We Provide Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repudiandae
                  nisi fuga facilis, consequuntur, maiores eveniet voluptatum, omnis possimus
                  temporibus aspernatur nobis animi in exercitationem vitae nulla! Adipisci ullam
                  illum quisquam. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorem,
                  nulla veniam? Magni aliquid asperiores magnam. Veniam ex tenetur.
                </p>
                <div className="hiraola-about-us_btn-area">
                  <Link className="about-us_btn" href="/shop-left-sidebar">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-5">
              <div className="overview-img text-center img-hover_effect">
                <a href="#">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="img-full"
                    src="/assets/images/about-us/1.jpg"
                    alt="Hiraola's About Us Image"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Hiraola's About Us Area End Here */}

      {/* Begin Hiraola's Project Countdown Area */}
      <div className="project-count-area">
        <div className="container">
          <div className="row">
            {counters.map((c) => (
              <div key={c.label} className="col-lg-3 col-md-6 col-sm-6">
                <div className="single-count text-center">
                  <div className="count-icon">
                    <span className={c.icon} />
                  </div>
                  <div className="count-title">
                    <h2 className="count">{c.count}</h2>
                    <span>{c.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Hiraola's Project Countdown Area End Here */}

      {/* Begin Hiraola's Team Area */}
      <div className="team-area">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="section_title-2">
                <h4>Our Team</h4>
              </div>
            </div>
          </div>
          <div className="row">
            {team.map((member) => (
              <div key={member.name} className="col-lg-3 col-md-6 col-sm-6">
                <div className="team-member">
                  <div className="team-thumb img-hover_effect">
                    <a href="#">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={member.img} alt="Our Team Member" />
                    </a>
                  </div>
                  <div className="team-content text-center">
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                    <a href="#">info@example.com</a>
                    <div className="hiraola-social_link">
                      <ul>
                        <li className="facebook">
                          <a
                            href="https://www.facebook.com"
                            data-bs-toggle="tooltip"
                            target="_blank"
                            title="Facebook"
                          >
                            <i className="fab fa-facebook" />
                          </a>
                        </li>
                        <li className="twitter">
                          <a
                            href="https://twitter.com"
                            data-bs-toggle="tooltip"
                            target="_blank"
                            title="Twitter"
                          >
                            <i className="fab fa-twitter-square" />
                          </a>
                        </li>
                        <li className="youtube">
                          <a
                            href="https://www.youtube.com"
                            data-bs-toggle="tooltip"
                            target="_blank"
                            title="Youtube"
                          >
                            <i className="fab fa-youtube" />
                          </a>
                        </li>
                        <li className="google-plus">
                          <a
                            href="https://www.plus.google.com/discover"
                            data-bs-toggle="tooltip"
                            target="_blank"
                            title="Google Plus"
                          >
                            <i className="fab fa-google-plus" />
                          </a>
                        </li>
                        <li className="instagram">
                          <a
                            href="https://rss.com"
                            data-bs-toggle="tooltip"
                            target="_blank"
                            title="Instagram"
                          >
                            <i className="fab fa-instagram" />
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Hiraola's Team Area End Here */}
    </>
  );
}
